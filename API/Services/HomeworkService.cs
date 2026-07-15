using academy_API.DTOs;

namespace academy_API.Services;

public interface IHomeworkService
{
    Task<HomeworkResponse> CreateAsync(HomeworkRequest request, int? instituteId, int assignedByUserId, CancellationToken ct = default);
    Task<HomeworkListResponse> GetByCourseIdAsync(int courseId, int? instituteId, CancellationToken ct = default);
    Task<HomeworkSubmissionsResponse> GetSubmissionsAsync(int homeworkId, int? instituteId, CancellationToken ct = default);
    Task<GradeSubmissionResponse> GradeSubmissionAsync(int submissionId, GradeSubmissionRequest request, int? instituteId, CancellationToken ct = default);
}

public class HomeworkService(Repositories.IHomeworkRepository repository) : IHomeworkService
{
    private readonly Repositories.IHomeworkRepository _repository = repository;

    public async Task<HomeworkResponse> CreateAsync(HomeworkRequest request, int? instituteId, int assignedByUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new HomeworkValidationException("TITLE_REQUIRED", "กรุณาระบุหัวข้อการบ้าน");

        var homework = new Models.Homework
        {
            CourseId = request.CourseId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            FileUrl = request.FileUrl?.Trim(),
            DueAt = request.DueAt,
            AssignedBy = assignedByUserId
        };

        var created = await _repository.CreateAsync(homework, ct);

        return new HomeworkResponse("success", "สร้างการบ้านสำเร็จ", new HomeworkData(created.Id, created.Title, created.DueAt));
    }

    public async Task<HomeworkListResponse> GetByCourseIdAsync(int courseId, int? instituteId, CancellationToken ct = default)
    {
        var items = await _repository.GetByCourseIdAsync(courseId, instituteId, ct);
        return new HomeworkListResponse("success", new HomeworkListData(items));
    }

    public async Task<HomeworkSubmissionsResponse> GetSubmissionsAsync(int homeworkId, int? instituteId, CancellationToken ct = default)
    {
        var homework = await _repository.GetHomeworkByIdAsync(homeworkId, instituteId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบการบ้าน");

        var submissions = await _repository.GetSubmissionsAsync(homeworkId, ct);
        return new HomeworkSubmissionsResponse("success", new HomeworkSubmissionsData(submissions));
    }

    public async Task<GradeSubmissionResponse> GradeSubmissionAsync(int submissionId, GradeSubmissionRequest request, int? instituteId, CancellationToken ct = default)
    {
        var submission = await _repository.GetSubmissionByIdAsync(submissionId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบงานที่ส่ง");

        submission.Score = request.Score;
        submission.Feedback = request.Feedback?.Trim();
        submission.SubmittedAt ??= DateTime.UtcNow;

        await _repository.UpdateSubmissionGradeAsync(submission, ct);

        return new GradeSubmissionResponse("success", "ให้คะแนนสำเร็จ");
    }
}

public class HomeworkValidationException : Exception
{
    public string ErrorCode { get; }
    public HomeworkValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}
