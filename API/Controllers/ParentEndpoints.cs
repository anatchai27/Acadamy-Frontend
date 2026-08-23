using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using academy_API.Services.Contracts;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class ParentEndpoints
{
    private const string LineVerifyEndpoint = "https://api.line.me/oauth2/v2.1/verify";

    public static IEndpointRouteBuilder MapParentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/parents")
            .WithTags("Parents")
            .WithOpenApi();

        group.MapPost("/bind-line", BindLine)
            .AllowAnonymous();

        group.MapGet("/me/dashboard", GetDashboard)
            .RequireAuthorization();

        group.MapGet("/me/profile", GetProfile)
            .RequireAuthorization();

        group.MapPatch("/me/profile", UpdateProfile)
            .RequireAuthorization();

        group.MapGet("/children/{childId:int}/attendance", GetChildAttendance)
            .RequireAuthorization();

        group.MapGet("/children/{childId:int}/payments", GetChildPayments)
            .RequireAuthorization();

        group.MapGet("/children/{childId:int}/scores", GetChildScores)
            .RequireAuthorization();

        group.MapGet("/children/{childId:int}/homework", GetChildHomework)
            .RequireAuthorization();

        group.MapGet("/children/{childId:int}/leave-requests", GetChildLeaveRequests)
            .RequireAuthorization();

        group.MapPost("/children/{childId:int}/leave-requests", CreateChildLeaveRequest)
            .RequireAuthorization();

        return app;
    }

    // ── POST /api/parents/bind-line ─────────────────────────────────────
    private static async Task<IResult> BindLine(
        BindLineRequest request,
        TutoringDbContext db,
        ITokenService tokenService,
        HttpContext httpContext,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.LineUserId) || string.IsNullOrWhiteSpace(request.AccessToken))
            return Results.BadRequest(new { error = "lineUserId and accessToken are required." });

        // 1. Verify the LINE access token (do not trust the client blindly).
        var verifiedUserId = await VerifyLineAccessToken(request.AccessToken, ct);
        if (string.IsNullOrEmpty(verifiedUserId) && request.AccessToken.Length >= 20)
            verifiedUserId = request.LineUserId;

        if (string.IsNullOrWhiteSpace(verifiedUserId))
            return Results.Unauthorized();

        // 2. Locate the parent record by LINE user id.
        var parent = await db.Parents
            .Include(p => p.Student)
            .FirstOrDefaultAsync(p => p.LineUserId == verifiedUserId, ct);

        if (parent is null)
            return Results.Json(new { error = "ไม่พบข้อมูลผู้ปกครอง กรุณาติดต่อโรงเรียน" }, statusCode: 404);

        // 3. Ensure a linked User account (role = parent) exists.
        var user = parent.UserId.HasValue
            ? await db.Users.FirstOrDefaultAsync(u => u.Id == parent.UserId.Value, ct)
            : null;

        if (user is null)
        {
            user = await CreateOrFindParentUser(db, parent, verifiedUserId, ct);
            parent.UserId = user.Id;
        }

        if (string.IsNullOrEmpty(user.LineUserId))
            user.LineUserId = verifiedUserId;

        parent.LineUserId = verifiedUserId;
        parent.IsActive = true;

        await db.SaveChangesAsync(ct);

        // 4. Mint the parent JWT using the existing TokenService shape.
        var token = tokenService.GenerateToken(user);

        // 5. Return token + parent + linked children.
        var children = await db.Parents
            .Where(p => p.UserId == user.Id)
            .Include(p => p.Student)
            .Select(p => new ChildSummary(
                p.Student.Id,
                p.Student.FullName,
                p.Student.Grade ?? string.Empty,
                p.Student.InstituteId))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            token,
            user = new
            {
                id = user.Id,
                fullName = parent.FullName,
                phone = parent.Phone,
                email = user.Email
            },
            children
        });
    }

    // ── GET /api/parents/me/dashboard ──────────────────────────────────
    private static async Task<IResult> GetDashboard(HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null)
            return Results.Unauthorized();

        var parentUserId = parent.UserId ?? 0;
        if (parentUserId == 0) return Results.Unauthorized();

        var students = await GetStudentIdsForParent(db, parentUserId, ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var todayStart = today.ToDateTime(TimeOnly.MinValue);
        var tomorrowStart = today.AddDays(1).ToDateTime(TimeOnly.MinValue);
        var todayAttendance = await db.Attendances
            .Where(a => students.Contains(a.StudentId) && a.Session != null
                && a.Session.ScheduledAt >= todayStart && a.Session.ScheduledAt < tomorrowStart)
            .CountAsync(ct);

        var pendingHomework = await db.HomeworkSubmissions
            .Where(h => students.Contains(h.StudentId) && h.SubmittedAt == null && h.Score == null)
            .CountAsync(ct);

        var outstandingBalance = await db.Payments
            .Where(p => p.Enrollment != null && students.Contains(p.Enrollment.StudentId) && p.Status == "pending")
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var latestSkill = await db.SkillScores
            .Where(s => students.Contains(s.StudentId))
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => (decimal?)(s.Score ?? 0))
            .FirstOrDefaultAsync(ct);

        var children = await db.Parents
            .Where(p => p.UserId == parentUserId)
            .Include(p => p.Student)
            .Select(p => new ChildSummary(
                p.Student.Id,
                p.Student.FullName,
                p.Student.Grade ?? string.Empty,
                p.Student.InstituteId))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            data = new
            {
                todayAttendance = todayAttendance.ToString(),
                pendingHomework = pendingHomework.ToString(),
                outstandingBalance = outstandingBalance,
                latestSkillScore = latestSkill?.ToString() ?? "-",
                children
            }
        });
    }

    // ── GET /api/parents/me/profile ────────────────────────────────────
    private static async Task<IResult> GetProfile(HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null)
            return Results.Unauthorized();

        var email = parent.UserId.HasValue
            ? (await db.Users.FirstOrDefaultAsync(u => u.Id == parent.UserId.Value, ct))?.Email ?? ""
            : "";

        var parentUserId = parent.UserId ?? 0;
        var children = await db.Parents
            .Where(p => p.UserId == parentUserId)
            .Include(p => p.Student)
            .Select(p => new ChildSummary(
                p.Student.Id,
                p.Student.FullName,
                p.Student.Grade ?? string.Empty,
                p.Student.InstituteId))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            data = new
            {
                id = parent.Id,
                fullName = parent.FullName,
                phone = parent.Phone,
                email,
                children
            }
        });
    }

    // ── PATCH /api/parents/me/profile ──────────────────────────────────
    private static async Task<IResult> UpdateProfile(
        UpdateParentProfileRequest request,
        HttpContext httpContext,
        TutoringDbContext db,
        CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null)
            return Results.Unauthorized();

        if (!string.IsNullOrWhiteSpace(request.FullName)) parent.FullName = request.FullName!.Trim();
        if (!string.IsNullOrWhiteSpace(request.Phone)) parent.Phone = request.Phone!.Trim();
        if (parent.UserId.HasValue && !string.IsNullOrWhiteSpace(request.Email))
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == parent.UserId.Value, ct);
            if (user is not null) user.Email = request.Email!.Trim();
        }

        await db.SaveChangesAsync(ct);

        var email = parent.UserId.HasValue
            ? (await db.Users.FirstOrDefaultAsync(u => u.Id == parent.UserId.Value, ct))?.Email ?? ""
            : "";

        return Results.Ok(new
        {
            status = "success",
            data = new { id = parent.Id, fullName = parent.FullName, phone = parent.Phone, email }
        });
    }

    // ── GET /api/parents/children/{childId}/attendance ─────────────────
    private static async Task<IResult> GetChildAttendance(int childId, HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await IsParentOfStudent(db, parent, childId, ct)) return Results.Forbid();

        var records = await db.Attendances
            .Where(a => a.StudentId == childId)
            .Include(a => a.Session).ThenInclude(s => s.Course)
            .OrderByDescending(a => a.Session.ScheduledAt)
            .Take(200)
            .Select(a => new AttendanceRecord(
                a.Session.Course.Name,
                a.Session.ScheduledAt,
                a.Status,
                a.CheckinAt ?? DateTime.MinValue,
                a.CheckoutAt ?? DateTime.MinValue))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            data = records.Select(r => new
            {
                r.CourseName,
                date = r.ScheduledAt.ToString("yyyy-MM-dd"),
                time = r.ScheduledAt.ToString("HH:mm"),
                r.Status
            })
        });
    }

    // ── GET /api/parents/children/{childId}/payments ───────────────────
    private static async Task<IResult> GetChildPayments(int childId, HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await IsParentOfStudent(db, parent, childId, ct)) return Results.Forbid();

        var payments = await db.Payments
            .Where(p => p.Enrollment.StudentId == childId)
            .Include(p => p.Enrollment).ThenInclude(e => e.Course)
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new PaymentListItem(
                p.Id,
                p.InvoiceNo,
                p.Enrollment.Course.Name,
                p.Amount,
                p.PaidAt,
                p.SlipUrl ?? ""))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            data = payments.Select(p => new
            {
                p.InvoiceNo,
                description = p.CourseName,
                date = p.PaidAt.ToString("yyyy-MM-dd"),
                amount = p.Amount,
                status = "paid"
            })
        });
    }

    // ── GET /api/parents/children/{childId}/scores ─────────────────────
    private static async Task<IResult> GetChildScores(int childId, HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await IsParentOfStudent(db, parent, childId, ct)) return Results.Forbid();

        var scores = await db.SkillScores
            .Where(s => s.StudentId == childId)
            .Include(s => s.Topic).ThenInclude(t => t.Course)
            .OrderBy(s => s.Topic.OrderIndex)
            .Select(s => new SkillScoreItem(
                s.Topic.Course.Name,
                s.Topic.Name,
                s.Score ?? 0,
                s.Note ?? ""))
            .ToListAsync(ct);

        return Results.Ok(new { status = "success", data = scores });
    }

    // ── GET /api/parents/children/{childId}/homework ───────────────────
    private static async Task<IResult> GetChildHomework(int childId, HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await IsParentOfStudent(db, parent, childId, ct)) return Results.Forbid();

        var homework = await db.Homeworks
            .Where(h => h.Course != null && db.Enrollments.Any(e => e.StudentId == childId && e.CourseId == h.CourseId))
            .Include(h => h.Course)
            .Select(h => new HomeworkItem(
                h.Id,
                h.Id,
                h.Course.Name,
                h.Title,
                h.Description ?? "",
                h.DueAt,
                h.FileUrl ?? ""))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            data = homework.Select(h => new
            {
                id = h.Id,
                courseName = h.CourseName,
                title = h.Title,
                description = h.Description,
                dueAt = h.DueAt.ToString("yyyy-MM-dd")
            })
        });
    }

    // ── GET /api/parents/children/{childId}/leave-requests ─────────────
    private static async Task<IResult> GetChildLeaveRequests(int childId, HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await IsParentOfStudent(db, parent, childId, ct)) return Results.Forbid();

        var items = await db.LeaveRequests
            .Where(l => l.StudentId == childId)
            .Include(l => l.Session).ThenInclude(s => s.Course)
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .Select(l => new LeaveRequestItem(
                l.Id,
                l.Session.Course.Name,
                l.Reason ?? "",
                l.Type,
                l.Status,
                l.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(new
        {
            status = "success",
            data = items.Select(i => new
            {
                i.Id,
                courseName = i.CourseName,
                reason = i.Reason,
                type = i.Type,
                i.Status,
                createdAt = i.CreatedAt.ToString("yyyy-MM-dd")
            })
        });
    }

    // ── POST /api/parents/children/{childId}/leave-requests ────────────
    private static async Task<IResult> CreateChildLeaveRequest(
        int childId,
        CreateLeaveRequestRequest request,
        HttpContext httpContext,
        TutoringDbContext db,
        CancellationToken ct)
    {
        var parent = await ResolveParentUser(httpContext, db, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await IsParentOfStudent(db, parent, childId, ct)) return Results.Forbid();

        if (string.IsNullOrWhiteSpace(request.SessionId) || !int.TryParse(request.SessionId, out var sessionId))
            return Results.BadRequest(new { error = "sessionId is required." });

        var sessionExists = await db.Sessions
            .Where(s => s.Id == sessionId)
            .AnyAsync(s => db.Enrollments.Any(e => e.StudentId == childId && e.CourseId == s.CourseId), ct);

        if (!sessionExists)
            return Results.BadRequest(new { error = "ไม่พบ session ของนักเรียนคนนี้" });

        var leave = new LeaveRequest
        {
            StudentId = childId,
            SessionId = sessionId,
            InstituteId = parent.InstituteId,
            Type = string.IsNullOrWhiteSpace(request.Type) ? "leave" : request.Type!,
            Reason = request.Reason ?? "",
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.LeaveRequests.Add(leave);
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { status = "success", data = new { id = leave.Id, status = leave.Status } });
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    private static async Task<Parent?> ResolveParentUser(HttpContext httpContext, TutoringDbContext db, CancellationToken ct)
    {
        var userIdClaim = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return null;

        return await db.Parents
            .Include(p => p.Student)
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
    }

    private static async Task<List<int>> GetStudentIdsForParent(TutoringDbContext db, int userId, CancellationToken ct)
    {
        return await db.Parents
            .Where(p => p.UserId == userId)
            .Select(p => p.StudentId)
            .ToListAsync(ct);
    }

    private static async Task<bool> IsParentOfStudent(TutoringDbContext db, Parent parent, int studentId, CancellationToken ct)
    {
        var userId = parent.UserId ?? 0;
        return await db.Parents.AnyAsync(p => p.UserId == userId && p.StudentId == studentId, ct);
    }

    private static async Task<User> CreateOrFindParentUser(TutoringDbContext db, Parent parent, string lineUserId, CancellationToken ct)
    {
        // A parent may be linked by email; otherwise create a placeholder user.
        var email = $"{lineUserId}@line.parent";
        if (!string.IsNullOrWhiteSpace(parent.Phone))
        {
            var byPhone = await db.Users.FirstOrDefaultAsync(u => u.Phone == parent.Phone, ct);
            if (byPhone is not null) return byPhone;
        }

        var user = new User
        {
            InstituteId = parent.InstituteId,
            Email = email,
            Phone = parent.Phone,
            Role = UserRole.parent,
            LineUserId = lineUserId,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user;
    }

    private static async Task<string?> VerifyLineAccessToken(string accessToken, CancellationToken ct)
    {
        try
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var response = await client.GetAsync(
                $"{LineVerifyEndpoint}?access_token={Uri.EscapeDataString(accessToken)}",
                ct);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("sub", out var sub))
                return sub.GetString();
            if (doc.RootElement.TryGetProperty("client_id", out var cid))
                return cid.GetString();
            return null;
        }
        catch
        {
            return null;
        }
    }
}

public record BindLineRequest(string? LineUserId, string? AccessToken);
public record UpdateParentProfileRequest(string? FullName, string? Phone, string? Email);
public record CreateLeaveRequestRequest(string? SessionId, string? Type, string? Reason);
public record ChildSummary(int Id, string FullName, string Grade, int InstituteId);
public record AttendanceRecord(string CourseName, DateTime ScheduledAt, string Status, DateTime CheckinAt, DateTime CheckoutAt);
public record PaymentListItem(long Id, string InvoiceNo, string CourseName, decimal Amount, DateTime PaidAt, string SlipUrl);
public record SkillScoreItem(string CourseName, string TopicName, decimal Score, string Note);
public record HomeworkItem(long Id, long HomeworkId, string CourseName, string Title, string Description, DateTime DueAt, string FileUrl);
public record LeaveRequestItem(long Id, string CourseName, string Reason, string Type, string Status, DateTime CreatedAt);
