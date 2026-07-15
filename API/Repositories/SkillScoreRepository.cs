using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ISkillScoreRepository
{
    Task<List<SkillTopic>> GetTopicsByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task BatchUpsertAsync(int studentId, List<SkillScoreItem> scores, int updatedBy, CancellationToken ct = default);
    Task<List<SkillScoreDetailItem>> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task CreateTopicAsync(SkillTopic topic, CancellationToken ct = default);
    Task<List<SkillTopicItem>> GetTopicsByCourseIdDtoAsync(int courseId, CancellationToken ct = default);
}

public class SkillScoreRepository(TutoringDbContext context) : ISkillScoreRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<List<SkillTopic>> GetTopicsByCourseIdAsync(int courseId, CancellationToken ct = default)
    {
        return await _context.SkillTopics
            .Where(t => t.CourseId == courseId)
            .OrderBy(t => t.OrderIndex)
            .ToListAsync(ct);
    }

    public async Task BatchUpsertAsync(int studentId, List<SkillScoreItem> scores, int updatedBy, CancellationToken ct = default)
    {
        foreach (var item in scores)
        {
            var existing = await _context.SkillScores
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.TopicId == item.TopicId, ct);

            if (existing is not null)
            {
                existing.Score = item.Score;
                existing.Note = item.Note?.Trim();
                existing.UpdatedBy = updatedBy;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.SkillScores.Add(new SkillScore
                {
                    StudentId = studentId,
                    TopicId = item.TopicId,
                    Score = item.Score,
                    Note = item.Note?.Trim(),
                    UpdatedBy = updatedBy,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<SkillScoreDetailItem>> GetByStudentIdAsync(int studentId, CancellationToken ct = default)
    {
        return await _context.SkillScores
            .Include(s => s.Topic)
            .Where(s => s.StudentId == studentId)
            .OrderBy(s => s.Topic.OrderIndex)
            .Select(s => new SkillScoreDetailItem(
                s.Id,
                s.TopicId,
                s.Topic.Name,
                s.Score,
                s.Note,
                s.UpdatedAt
            ))
            .ToListAsync(ct);
    }

    public async Task CreateTopicAsync(SkillTopic topic, CancellationToken ct = default)
    {
        _context.SkillTopics.Add(topic);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<SkillTopicItem>> GetTopicsByCourseIdDtoAsync(int courseId, CancellationToken ct = default)
    {
        return await _context.SkillTopics
            .Where(t => t.CourseId == courseId)
            .OrderBy(t => t.OrderIndex)
            .Select(t => new SkillTopicItem(t.Id, t.Name, t.OrderIndex))
            .ToListAsync(ct);
    }
}
