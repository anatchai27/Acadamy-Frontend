using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Services;

public class HomeworkService(IHomeworkRepository repository) : IHomeworkService
{
    private readonly IHomeworkRepository _repository = repository;

    public async Task<HomeworkResponse> CreateAsync(HomeworkRequest request, int assignedByUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new HomeworkValidationException("TITLE_REQUIRED", "กรุณาระบุหัวข้อการบ้าน");

        var instituteId = await _repository.GetCourseInstituteIdAsync(request.CourseId, ct);
        if (!instituteId.HasValue)
            throw new HomeworkValidationException("COURSE_NOT_FOUND", "ไม่พบคอร์สเรียน หรือไม่มีสิทธิ์เข้าถึงคอร์สนี้");

        var assignedByTeacherId = await _repository.GetTeacherIdByUserIdAsync(assignedByUserId, ct);
        var homework = new Models.Homework
        {
            CourseId = request.CourseId,
            InstituteId = instituteId.Value,
            Title = request.Title.Trim(),
            TitleEn = Clean(request.TitleEn),
            Description = request.Description?.Trim(),
            DescriptionEn = Clean(request.DescriptionEn),
            FileUrl = request.FileUrl?.Trim(),
            DueAt = request.DueAt,
            AssignedBy = assignedByTeacherId
        };

        var created = await _repository.CreateAsync(homework, ct);

        return new HomeworkResponse("success", "สร้างการบ้านสำเร็จ", new HomeworkData(created.Id, created.Title, created.DueAt, created.TitleEn, created.DescriptionEn));
    }

    public async Task<HomeworkListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default)
    {
        var items = await _repository.GetByCourseIdAsync(courseId, ct);
        return new HomeworkListResponse("success", new HomeworkListData(items));
    }

    public async Task<HomeworkSubmissionsResponse> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default)
    {
        var homework = await _repository.GetHomeworkByIdAsync(homeworkId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบการบ้าน");

        var submissions = await _repository.GetSubmissionsAsync(homeworkId, ct);
        return new HomeworkSubmissionsResponse("success", new HomeworkSubmissionsData(submissions));
    }

    public async Task<List<HomeworkStudentRosterItem>> GetSubmissionRosterAsync(
        int homeworkId, int instituteId, int userId, bool isAdmin, CancellationToken ct = default)
    {
        if (!await _repository.CanManageHomeworkAsync(homeworkId, instituteId, userId, isAdmin, ct))
            throw new HomeworkValidationException("FORBIDDEN", "ไม่มีสิทธิ์จัดการการบ้านนี้");
        return await _repository.GetSubmissionRosterAsync(homeworkId, instituteId, ct);
    }

    public async Task<HomeworkSubmission> CreateOrGetSubmissionForStudentAsync(
        int homeworkId, int studentId, int instituteId, int userId, bool isAdmin, CancellationToken ct = default)
    {
        if (!await _repository.CanManageHomeworkAsync(homeworkId, instituteId, userId, isAdmin, ct))
            throw new HomeworkValidationException("FORBIDDEN", "ไม่มีสิทธิ์จัดการการบ้านนี้");
        return await _repository.CreateOrGetSubmissionForStudentAsync(homeworkId, studentId, instituteId, ct)
            ?? throw new HomeworkValidationException("STUDENT_NOT_ENROLLED", "ไม่พบนักเรียนในคอร์สที่สั่งการบ้านนี้");
    }

    public Task<bool> CanManageSubmissionAsync(int submissionId, int instituteId, int userId, CancellationToken ct = default) =>
        _repository.CanManageSubmissionAsync(submissionId, instituteId, userId, ct);

    public async Task<GradeSubmissionResponse> GradeSubmissionAsync(int submissionId, GradeSubmissionRequest request, CancellationToken ct = default)
    {
        var submission = await _repository.GetSubmissionByIdAsync(submissionId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบงานที่ส่ง");

        submission.Score = request.Score;
        submission.Feedback = request.Feedback?.Trim();
        submission.SubmittedAt ??= DateTime.UtcNow;

        await _repository.UpdateSubmissionGradeAsync(submission, ct);

        return new GradeSubmissionResponse("success", "ให้คะแนนสำเร็จ");
    }

    public Task<HomeworkSkillMappingResponse> GetSkillMappingAsync(int homeworkId, CancellationToken ct = default) =>
        _repository.GetSkillMappingAsync(homeworkId, ct);

    public Task<HomeworkSkillMappingResponse> SetSkillMappingAsync(int homeworkId, HomeworkSkillMappingRequest request, CancellationToken ct = default)
    {
        if (request.TopicIds is null || request.TopicIds.Distinct().Count() != request.TopicIds.Count)
            throw new HomeworkValidationException("INVALID_TOPIC_MAPPING", "รายการ skill topic ซ้ำกันหรือไม่ถูกต้อง");
        return _repository.SetSkillMappingAsync(homeworkId, request.TopicIds.Distinct().ToList(), ct);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

