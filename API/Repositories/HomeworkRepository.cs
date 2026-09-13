using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IHomeworkRepository
{
    Task<Homework> CreateAsync(Homework homework, CancellationToken ct = default);
    Task<List<HomeworkItem>> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<List<HomeworkSubmissionItem>> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default);
    Task<HomeworkSubmission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default);
    Task<Homework?> GetHomeworkByIdAsync(int homeworkId, CancellationToken ct = default);
    Task UpdateSubmissionGradeAsync(HomeworkSubmission submission, CancellationToken ct = default);
    Task<HomeworkSkillMappingResponse> GetSkillMappingAsync(int homeworkId, CancellationToken ct = default);
    Task<HomeworkSkillMappingResponse> SetSkillMappingAsync(int homeworkId, List<int> topicIds, CancellationToken ct = default);
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

    public async Task<List<HomeworkItem>> GetByCourseIdAsync(int courseId, CancellationToken ct = default)
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

    public async Task<Homework?> GetHomeworkByIdAsync(int homeworkId, CancellationToken ct = default)
    {
        return await _context.Homeworks
            .Include(h => h.Course)
            .FirstOrDefaultAsync(h => h.Id == homeworkId, ct);
    }

    public async Task UpdateSubmissionGradeAsync(HomeworkSubmission submission, CancellationToken ct = default)
    {
        var mappings = await _context.HomeworkSkillTopics
            .Where(x => x.HomeworkId == submission.HomeworkId)
            .ToListAsync(ct);
        foreach (var mapping in mappings)
        {
            var score = await _context.SkillScores.FirstOrDefaultAsync(x =>
                x.StudentId == submission.StudentId && x.TopicId == mapping.TopicId, ct);
            if (score is null)
            {
                _context.SkillScores.Add(new SkillScore
                {
                    InstituteId = submission.InstituteId,
                    StudentId = submission.StudentId,
                    TopicId = mapping.TopicId,
                    Score = submission.Score,
                    Note = submission.Feedback,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                score.Score = submission.Score;
                score.Note = submission.Feedback;
                score.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _context.SaveChangesAsync(ct);
    }

    public async Task<HomeworkSkillMappingResponse> GetSkillMappingAsync(int homeworkId, CancellationToken ct = default)
    {
        var homework = await _context.Homeworks.FirstOrDefaultAsync(x => x.Id == homeworkId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบการบ้าน");
        var topicIds = await _context.HomeworkSkillTopics
            .Where(x => x.HomeworkId == homework.Id)
            .Select(x => x.TopicId)
            .ToListAsync(ct);
        return new HomeworkSkillMappingResponse("success", homeworkId, topicIds);
    }

    public async Task<HomeworkSkillMappingResponse> SetSkillMappingAsync(int homeworkId, List<int> topicIds, CancellationToken ct = default)
    {
        var homework = await _context.Homeworks.FirstOrDefaultAsync(x => x.Id == homeworkId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบการบ้าน");
        var validTopicIds = await _context.SkillTopics
            .Where(x => x.CourseId == homework.CourseId && topicIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(ct);
        if (validTopicIds.Count != topicIds.Count)
            throw new HomeworkValidationException("INVALID_TOPIC_MAPPING", "skill topic ต้องอยู่ใน course เดียวกับการบ้าน");

        var existing = await _context.HomeworkSkillTopics.Where(x => x.HomeworkId == homeworkId).ToListAsync(ct);
        _context.HomeworkSkillTopics.RemoveRange(existing);
        _context.HomeworkSkillTopics.AddRange(validTopicIds.Select(topicId => new HomeworkSkillTopic
        {
            InstituteId = homework.InstituteId,
            HomeworkId = homeworkId,
            TopicId = topicId,
            CreatedAt = DateTime.UtcNow
        }));
        await _context.SaveChangesAsync(ct);
        return new HomeworkSkillMappingResponse("success", homeworkId, validTopicIds);
    }
}
