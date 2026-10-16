using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IHomeworkService
{
    Task<HomeworkResponse> CreateAsync(HomeworkRequest request, int assignedByUserId, CancellationToken ct = default);
    Task<HomeworkListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<HomeworkSubmissionsResponse> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default);
    Task<GradeSubmissionResponse> GradeSubmissionAsync(int submissionId, GradeSubmissionRequest request, CancellationToken ct = default);
    Task<HomeworkSkillMappingResponse> GetSkillMappingAsync(int homeworkId, CancellationToken ct = default);
    Task<HomeworkSkillMappingResponse> SetSkillMappingAsync(int homeworkId, HomeworkSkillMappingRequest request, CancellationToken ct = default);
}