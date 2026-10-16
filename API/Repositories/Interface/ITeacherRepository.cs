using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ITeacherRepository
{
    Task<List<TeacherResponse>> ListAsync(string? search, CancellationToken ct = default);
    Task<Teacher?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> HasMembershipAsync(int userId, CancellationToken ct = default);
    Task<Teacher> CreateAsync(Teacher teacher, User? user, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    Task DeleteAsync(Teacher teacher, CancellationToken ct = default);
}