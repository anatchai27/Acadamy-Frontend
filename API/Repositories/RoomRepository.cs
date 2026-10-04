using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IRoomRepository
{
    Task<List<RoomResponse>> ListAsync(CancellationToken ct = default);
    Task<RoomResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<RoomResponse> CreateAsync(Room room, CancellationToken ct = default);
    Task<RoomResponse?> UpdateAsync(int id, string name, string? description, bool isActive, string? nameEn = null, string? descriptionEn = null, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, int? exceptId = null, CancellationToken ct = default);
}

public sealed class RoomRepository(TutoringDbContext context) : IRoomRepository
{
    private readonly TutoringDbContext _context = context;

    public Task<List<RoomResponse>> ListAsync(CancellationToken ct = default) =>
        _context.Rooms.AsNoTracking().OrderBy(r => r.Name).Select(Map).ToListAsync(ct);

    public Task<RoomResponse?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.Rooms.AsNoTracking().Where(r => r.Id == id).Select(Map).FirstOrDefaultAsync(ct);

    public async Task<RoomResponse> CreateAsync(Room room, CancellationToken ct = default)
    {
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync(ct);
        return await GetByIdAsync(room.Id, ct) ?? throw new InvalidOperationException("Room was not created.");
    }

    public async Task<RoomResponse?> UpdateAsync(int id, string name, string? description, bool isActive, string? nameEn = null, string? descriptionEn = null, CancellationToken ct = default)
    {
        var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (room is null) return null;
        room.Name = name;
        if (nameEn is not null) room.NameEn = Clean(nameEn);
        room.Description = description;
        if (descriptionEn is not null) room.DescriptionEn = Clean(descriptionEn);
        room.IsActive = isActive;
        room.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (room is null) return false;
        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public Task<bool> ExistsByNameAsync(string name, int? exceptId = null, CancellationToken ct = default) =>
        _context.Rooms.AnyAsync(r => r.Name == name && (!exceptId.HasValue || r.Id != exceptId.Value), ct);

    private static readonly System.Linq.Expressions.Expression<Func<Room, RoomResponse>> Map =
        room => new RoomResponse(room.Id, room.InstituteId, room.Name, room.Description, room.IsActive, room.CreatedAt, room.UpdatedAt, room.NameEn, room.DescriptionEn);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
