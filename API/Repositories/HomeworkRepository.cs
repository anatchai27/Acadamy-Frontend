using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IHomeworkRepository
{
    Task<Homework> CreateAsync(Homework homework, CancellationToken ct = default);
    Task<List<HomeworkItem>> GetByCourseIdAsync(int courseId, int? instituteId, CancellationToken ct = default);
    Task<List<HomeworkSubmissionItem>> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default);
    Task<HomeworkSubmission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default);
    Task<Homework?> GetHomeworkByIdAsync(int homeworkId, int? instituteId, CancellationToken ct = default);
    Task UpdateSubmissionGradeAsync(HomeworkSubmission submission, CancellationToken ct = default);
}

public class HomeworkRepository(TutoringDbContext context) : IHomeworkRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<Homework> CreateAsync(Homework homework, CancellationToken ct = default)
    {
        _context.Homeworks.Add(homework);
        await _context.SaveChangesAsync(ct);
        return homework;
    }

    public async Task<List<HomeworkItem>> GetByCourseIdAsync(int courseId, int? instituteId, CancellationToken ct = default)
    {
        return await _context.Homeworks
            .Where(h => h.CourseId == courseId)
            .OrderByDescending(h => h.DueAt)
            .Select(h => new HomeworkItem(
                h.Id,
                h.Title,
                h.Description,
                h.FileUrl,
                h.DueAt,
                h.CourseId
            ))
            .ToListAsync(ct);
    }

    public async Task<List<HomeworkSubmissionItem>> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default)
    {
        return await _context.HomeworkSubmissions
            .Include(s => s.Student)
            .Where(s => s.HomeworkId == homeworkId)
            .OrderBy(s => s.Student.FullName)
            .Select(s => new HomeworkSubmissionItem(
                s.Id,
                s.StudentId,
                s.Student.FullName,
                s.SubmittedAt,
                s.FileUrl,
                s.Score,
                s.Feedback
            ))
            .ToListAsync(ct);
    }

    public async Task<HomeworkSubmission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default)
    {
        return await _context.HomeworkSubmissions
            .FirstOrDefaultAsync(s => s.Id == submissionId, ct);
    }

    public async Task<Homework?> GetHomeworkByIdAsync(int homeworkId, int? instituteId, CancellationToken ct = default)
    {
        var query = _context.Homeworks
            .Include(h => h.Course)
            .AsQueryable();

        if (instituteId.HasValue)
            query = query.Where(h => h.Course.InstituteId == instituteId.Value);

        return await query.FirstOrDefaultAsync(h => h.Id == homeworkId, ct);
    }

    public async Task UpdateSubmissionGradeAsync(HomeworkSubmission submission, CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
