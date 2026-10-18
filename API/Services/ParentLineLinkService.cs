using System.Security.Cryptography;
using System.Text;
using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services.Contracts;
using academy_API.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Services;

public sealed class ParentLineLinkService(TutoringDbContext context) : IParentLineLinkService
{
    private const int CodeLifetimeDays = 5;
    private const string CodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private readonly TutoringDbContext _context = context;

    public async Task<IssuedParentLineLinkCode?> IssueAsync(
        int parentId,
        int instituteId,
        int actorUserId,
        CancellationToken ct = default)
    {
        var parent = await _context.Parents
            .FirstOrDefaultAsync(p => p.Id == parentId && p.InstituteId == instituteId, ct);
        if (parent is null || !string.IsNullOrWhiteSpace(parent.LineUserId)) return null;
        if (parent.UserId.HasValue)
        {
            var linkedUser = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == parent.UserId.Value && u.InstituteId == instituteId, ct);
            if (linkedUser is null || !string.IsNullOrWhiteSpace(linkedUser.LineUserId)) return null;
        }

        var now = DateTime.UtcNow;
        var code = GenerateCode();
        var codeHash = HashCode(code);
        await using var transaction = await _context.Database.BeginTransactionAsync(ct);

        await _context.ParentLineLinkCodes
            .Where(c => c.ParentId == parentId && c.RedeemedAt == null && c.RevokedAt == null)
            .ExecuteUpdateAsync(update => update.SetProperty(c => c.RevokedAt, now), ct);

        _context.ParentLineLinkCodes.Add(new ParentLineLinkCode
        {
            ParentId = parentId,
            InstituteId = instituteId,
            CreatedByUserId = actorUserId,
            CodeHash = codeHash,
            CreatedAt = now,
            ExpiresAt = now.AddDays(CodeLifetimeDays)
        });
        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return new IssuedParentLineLinkCode(code, now.AddDays(CodeLifetimeDays));
    }

    public async Task<ParentLineLinkOutcome> RedeemAsync(
        string code,
        string verifiedLineUserId,
        CancellationToken ct = default)
    {
        var normalizedCode = NormalizeCode(code);
        if (normalizedCode.Length != 12 || normalizedCode.Any(character => !CodeAlphabet.Contains(character)))
            return new ParentLineLinkOutcome(ParentLineLinkStatus.InvalidCode);

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        var link = await _context.ParentLineLinkCodes
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.CodeHash == HashCode(normalizedCode), ct);
        if (link is null) return new ParentLineLinkOutcome(ParentLineLinkStatus.InvalidCode);

        var now = DateTime.UtcNow;
        if (link.ExpiresAt <= now) return new ParentLineLinkOutcome(ParentLineLinkStatus.Expired);
        if (link.RevokedAt.HasValue || link.RedeemedAt.HasValue)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.AlreadyUsed);

        var parent = await _context.Parents.IgnoreQueryFilters()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == link.ParentId && p.InstituteId == link.InstituteId, ct);
        if (parent is null)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);
        var user = parent.UserId.HasValue
            ? await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == parent.UserId.Value && u.InstituteId == link.InstituteId, ct)
            : null;
        if (parent.UserId.HasValue && user is null)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);
        if (!string.IsNullOrWhiteSpace(parent.LineUserId) && parent.LineUserId != verifiedLineUserId)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);

        var lineUsers = await _context.Users.IgnoreQueryFilters()
            .Where(u => u.LineUserId == verifiedLineUserId)
            .Take(2)
            .ToListAsync(ct);
        if (lineUsers.Count > 1)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);
        var lineUser = lineUsers.SingleOrDefault();
        if (lineUser is not null)
        {
            if (lineUser.Role != UserRole.parent || lineUser.InstituteId != link.InstituteId ||
                (user is not null && user.Id != lineUser.Id))
                return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);
            user = lineUser;
        }

        if (user is not null && (user.Role != UserRole.parent || user.InstituteId != link.InstituteId ||
            (!string.IsNullOrWhiteSpace(user.LineUserId) && user.LineUserId != verifiedLineUserId)))
            return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);

        var expectedUserId = user?.Id ?? parent.UserId;
        var conflictingParent = await _context.Parents.IgnoreQueryFilters()
            .AnyAsync(p => p.LineUserId == verifiedLineUserId &&
            (p.UserId != expectedUserId || p.InstituteId != link.InstituteId), ct);
        if (conflictingParent)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);

        if (user is null)
        {
            var email = $"{verifiedLineUserId}@line.parent";
            if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email, ct))
                return new ParentLineLinkOutcome(ParentLineLinkStatus.Conflict);

            user = new User
            {
                InstituteId = link.InstituteId,
                Email = email,
                Phone = parent.Phone,
                Role = UserRole.parent,
                LineUserId = verifiedLineUserId,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Users.Add(user);
        }

        var consumed = await _context.ParentLineLinkCodes
            .Where(c => c.Id == link.Id && c.RedeemedAt == null && c.RevokedAt == null && c.ExpiresAt > now)
            .ExecuteUpdateAsync(update => update
                .SetProperty(c => c.RedeemedAt, now)
                .SetProperty(c => c.RedeemedByLineUserId, verifiedLineUserId), ct);
        if (consumed != 1)
            return new ParentLineLinkOutcome(ParentLineLinkStatus.AlreadyUsed);

        parent.User = user;
        parent.UserId = user.Id;
        parent.LineUserId = verifiedLineUserId;
        parent.IsActive = true;
        user.LineUserId = verifiedLineUserId;
        user.UpdatedAt = now;

        await _context.SaveChangesAsync(ct);
        var children = await _context.Parents.IgnoreQueryFilters()
            .Where(p => p.UserId == user.Id && p.InstituteId == link.InstituteId && p.Student.InstituteId == link.InstituteId)
            .Select(p => new ChildSummary(
                p.Student.Id,
                p.Student.FullName,
                p.Student.Grade ?? string.Empty,
                p.Student.InstituteId))
            .ToListAsync(ct);
        await transaction.CommitAsync(ct);

        return new ParentLineLinkOutcome(ParentLineLinkStatus.Success,
            new RedeemedParentLineLink(user, parent, children));
    }

    private static string GenerateCode()
    {
        var code = new char[12];
        var written = 0;
        Span<byte> randomBytes = stackalloc byte[32];

        while (written < code.Length)
        {
            RandomNumberGenerator.Fill(randomBytes);
            foreach (var value in randomBytes)
            {
                if (value >= 224) continue;
                code[written++] = CodeAlphabet[value % CodeAlphabet.Length];
                if (written == code.Length) break;
            }
        }

        return new string(code);
    }

    private static string NormalizeCode(string code) =>
        new(code.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());

    private static string HashCode(string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
}
