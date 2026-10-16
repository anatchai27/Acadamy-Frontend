using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface ISkillScoreService
{
    Task<BatchSkillScoreResponse> BatchUpdateAsync(BatchSkillScoreRequest request, int updatedByUserId, CancellationToken ct = default);
    Task<SkillScoreListResponse> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task CreateTopicAsync(SkillTopicRequest request, CancellationToken ct = default);
    Task<SkillTopicListResponse> GetTopicsByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task UpdateTopicAsync(int id, SkillTopicRequest request, CancellationToken ct = default);
    Task DeleteTopicAsync(int id, CancellationToken ct = default);
}