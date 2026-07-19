using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public class UserRepository(TutoringDbContext context) : IUserRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<User>> GetByInstituteIdAsync(int instituteId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Where(u => u.InstituteId == instituteId)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Student)
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetByIdWithProfileAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<bool> UpdateRoleAsync(int id, UserRole role, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null) return false;

        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}