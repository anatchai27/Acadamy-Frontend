using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ISkillScoreRepository
{
    Task<List<SkillTopic>> GetTopicsByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task BatchUpsertAsync(int studentId, List<SkillScoreItem> scores, int updatedBy, CancellationToken ct = default);
    Task<List<SkillScoreDetailItem>> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task CreateTopicAsync(SkillTopic topic, CancellationToken ct = default);
    Task<List<SkillTopicItem>> GetTopicsByCourseIdDtoAsync(int courseId, CancellationToken ct = default);
    Task UpdateTopicAsync(int id, SkillTopic topic, CancellationToken ct = default);
    Task DeleteTopicAsync(int id, CancellationToken ct = default);
}