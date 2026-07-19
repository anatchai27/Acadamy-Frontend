using academy_API.DTOs;

namespace academy_API.Services;

public interface ISkillScoreService
{
    Task<BatchSkillScoreResponse> BatchUpdateAsync(BatchSkillScoreRequest request, int updatedByUserId, CancellationToken ct = default);
    Task<SkillScoreListResponse> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task CreateTopicAsync(SkillTopicRequest request, CancellationToken ct = default);
    Task<SkillTopicListResponse> GetTopicsByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task UpdateTopicAsync(int id, SkillTopicRequest request, CancellationToken ct = default);
    Task DeleteTopicAsync(int id, CancellationToken ct = default);
}

public class SkillScoreService(Repositories.ISkillScoreRepository repository) : ISkillScoreService
{
    private readonly Repositories.ISkillScoreRepository _repository = repository;

    public async Task<BatchSkillScoreResponse> BatchUpdateAsync(BatchSkillScoreRequest request, int updatedByUserId, CancellationToken ct = default)
    {
        if (request.Scores is null || request.Scores.Count == 0)
            throw new SkillScoreValidationException("NO_SCORES", "กรุณาระบุคะแนนอย่างน้อย 1 รายการ");

        await _repository.BatchUpsertAsync(request.StudentId, request.Scores, updatedByUserId, ct);

        return new BatchSkillScoreResponse("success", "บันทึกคะแนนสำเร็จ");
    }

    public async Task<SkillScoreListResponse> GetByStudentIdAsync(int studentId, CancellationToken ct = default)
    {
        var scores = await _repository.GetByStudentIdAsync(studentId);
        var studentName = scores.FirstOrDefault()?.TopicName ?? "Unknown";

        return new SkillScoreListResponse("success", new SkillScoreListData(studentId, studentName, scores));
    }

    public async Task CreateTopicAsync(SkillTopicRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new SkillScoreValidationException("NAME_REQUIRED", "กรุณาระบุชื่อหัวข้อทักษะ");

        var topic = new Models.SkillTopic
        {
            CourseId = request.CourseId,
            Name = request.Name.Trim(),
            OrderIndex = request.OrderIndex
        };

        await _repository.CreateTopicAsync(topic, ct);
    }

    public async Task<SkillTopicListResponse> GetTopicsByCourseIdAsync(int courseId, CancellationToken ct = default)
    {
        var topics = await _repository.GetTopicsByCourseIdDtoAsync(courseId);
        return new SkillTopicListResponse("success", new SkillTopicListData(topics));
    }

    public async Task UpdateTopicAsync(int id, SkillTopicRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new SkillScoreValidationException("NAME_REQUIRED", "กรุณาระบุชื่อหัวข้อทักษะ");

        var topic = new Models.SkillTopic
        {
            Name = request.Name.Trim(),
            OrderIndex = request.OrderIndex
        };

        await _repository.UpdateTopicAsync(id, topic, ct);
    }

    public async Task DeleteTopicAsync(int id, CancellationToken ct = default)
    {
        await _repository.DeleteTopicAsync(id, ct);
    }
}

public class SkillScoreValidationException : Exception
{
    public string ErrorCode { get; }
    public SkillScoreValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}