using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IRoomRepository
{
    Task<List<RoomResponse>> ListAsync(CancellationToken ct = default);
    Task<RoomResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<RoomResponse> CreateAsync(Room room, CancellationToken ct = default);
    Task<RoomResponse?> UpdateAsync(int id, string name, string? description, bool isActive, string? nameEn = null, string? descriptionEn = null, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, int? exceptId = null, CancellationToken ct = default);
}