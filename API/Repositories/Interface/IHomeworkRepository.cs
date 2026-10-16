using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IHomeworkRepository
{
    Task<int?> GetTeacherIdByUserIdAsync(int userId, CancellationToken ct = default);
    Task<Homework> CreateAsync(Homework homework, CancellationToken ct = default);
    Task<List<HomeworkItem>> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<List<HomeworkSubmissionItem>> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default);
    Task<HomeworkSubmission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default);
    Task<Homework?> GetHomeworkByIdAsync(int homeworkId, CancellationToken ct = default);
    Task UpdateSubmissionGradeAsync(HomeworkSubmission submission, CancellationToken ct = default);
    Task<HomeworkSkillMappingResponse> GetSkillMappingAsync(int homeworkId, CancellationToken ct = default);
    Task<HomeworkSkillMappingResponse> SetSkillMappingAsync(int homeworkId, List<int> topicIds, CancellationToken ct = default);
}