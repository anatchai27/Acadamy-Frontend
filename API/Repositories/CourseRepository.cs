using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ICourseRepository
{
    Task<List<CourseItem>> SearchAsync(int? instituteId, string? search, int? teacherId, CancellationToken ct = default);
    Task<Course?> GetByIdAsync(int id, int? instituteId, CancellationToken ct = default);
    Task<Course> CreateAsync(Course course, CancellationToken ct = default);
    Task<Course?> UpdateAsync(int id, UpdateCourseRequest request, int? instituteId, CancellationToken ct = default);
}

public class CourseRepository(TutoringDbContext context) : ICourseRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<List<CourseItem>> SearchAsync(int? instituteId, string? search, int? teacherId, CancellationToken ct = default)
    {
        var query = _context.Courses
            .Include(c => c.Teacher)
            .AsQueryable();

        if (instituteId.HasValue)
            query = query.Where(c => c.InstituteId == instituteId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                c.Name.Contains(term) ||
                c.Subject.Contains(term));
        }

        if (teacherId.HasValue)
            query = query.Where(c => c.TeacherId == teacherId.Value);

        return await query
            .OrderBy(c => c.Name)
            .Select(c => new CourseItem(
                c.Id,
                c.Name,
                c.Subject,
                c.TotalSessions,
                c.Price,
                c.Teacher != null ? c.Teacher.FullName : null
            ))
            .ToListAsync(ct);
    }

    public async Task<Course?> GetByIdAsync(int id, int? instituteId, CancellationToken ct = default)
    {
        var query = _context.Courses
            .Include(c => c.Teacher)
            .AsQueryable();

        if (instituteId.HasValue)
            query = query.Where(c => c.InstituteId == instituteId.Value);

        return await query.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<Course> CreateAsync(Course course, CancellationToken ct = default)
    {
        _context.Courses.Add(course);
        await _context.SaveChangesAsync(ct);
        return course;
    }

    public async Task<Course?> UpdateAsync(int id, UpdateCourseRequest request, int? instituteId, CancellationToken ct = default)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (course is null)
            return null;

        if (instituteId.HasValue && course.InstituteId != instituteId.Value)
            throw new InvalidOperationException("FORBIDDEN");

        if (request.Name is not null) course.Name = request.Name.Trim();
        if (request.Subject is not null) course.Subject = request.Subject.Trim();
        if (request.TotalSessions.HasValue) course.TotalSessions = request.TotalSessions.Value;
        if (request.Price.HasValue) course.Price = request.Price.Value;
        if (request.TeacherId is not null) course.TeacherId = request.TeacherId;

        await _context.SaveChangesAsync(ct);
        return course;
    }
}
