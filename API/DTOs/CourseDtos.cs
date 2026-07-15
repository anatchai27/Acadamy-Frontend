namespace academy_API.DTOs;

public record CourseListResponse(
    string Status,
    CourseListData Data
);

public record CourseListData(
    List<CourseItem> Courses
);

public record CourseItem(
    int Id,
    string Name,
    string? Subject,
    int TotalSessions,
    decimal Price,
    string? TeacherName
);

public record CreateCourseRequest(
    string Name,
    string Subject,
    int TotalSessions,
    decimal Price,
    int? TeacherId
);

public record CreateCourseResponse(
    string Status,
    string Message,
    CreateCourseData Data
);

public record CreateCourseData(
    int CourseId,
    string Name,
    DateTime CreatedAt
);

public record UpdateCourseRequest(
    string? Name,
    string? Subject,
    int? TotalSessions,
    decimal? Price,
    int? TeacherId
);

public record CreateSessionRequest(
    DateTime ScheduledAt,
    int DurationMin,
    string? RoomId
);

public record CreateSessionResponse(
    string Status,
    string Message,
    CreateSessionData Data
);

public record CreateSessionData(
    int SessionId,
    DateTime ScheduledAt
);

public record SessionListResponse(
    string Status,
    SessionListData Data
);

public record SessionListData(
    List<SessionItem> Sessions
);

public record SessionItem(
    int Id,
    int CourseId,
    string CourseName,
    DateTime ScheduledAt,
    int DurationMin,
    string? RoomId,
    string Status
);

public record LeaveRequestResponse(
    string Status,
    LeaveRequestData Data
);

public record LeaveRequestData(
    List<LeaveRequestItem> Requests,
    LeaveRequestPagination Pagination
);

public record LeaveRequestItem(
    int Id,
    int StudentId,
    string StudentName,
    int SessionId,
    DateTime SessionScheduledAt,
    string? Reason,
    string Type,
    string Status,
    DateTime RequestedAt
);

public record LeaveRequestPagination(
    int CurrentPage,
    int TotalPages,
    int TotalItems
);

public record HomeworkRequest(
    int CourseId,
    string Title,
    string? Description,
    string? FileUrl,
    DateTime DueAt
);

public record HomeworkResponse(
    string Status,
    string Message,
    HomeworkData Data
);

public record HomeworkData(
    int HomeworkId,
    string Title,
    DateTime DueAt
);

public record HomeworkListResponse(
    string Status,
    HomeworkListData Data
);

public record HomeworkListData(
    List<HomeworkItem> Homeworks
);

public record HomeworkItem(
    int Id,
    string Title,
    string? Description,
    string? FileUrl,
    DateTime DueAt,
    int SubmissionCount
);

public record HomeworkSubmissionItem(
    int Id,
    int StudentId,
    string StudentName,
    DateTime? SubmittedAt,
    string? FileUrl,
    decimal? Score,
    string? Feedback
);

public record HomeworkSubmissionsResponse(
    string Status,
    HomeworkSubmissionsData Data
);

public record HomeworkSubmissionsData(
    List<HomeworkSubmissionItem> Submissions
);

public record GradeSubmissionRequest(
    decimal Score,
    string? Feedback
);

public record GradeSubmissionResponse(
    string Status,
    string Message
);

public record BatchSkillScoreRequest(
    int StudentId,
    List<SkillScoreItem> Scores
);

public record SkillScoreItem(
    int TopicId,
    decimal Score,
    string? Note
);

public record BatchSkillScoreResponse(
    string Status,
    string Message
);

public record SkillScoreListResponse(
    string Status,
    SkillScoreListData Data
);

public record SkillScoreListData(
    int StudentId,
    string StudentName,
    List<SkillScoreDetailItem> Scores
);

public record SkillScoreDetailItem(
    int Id,
    int TopicId,
    string TopicName,
    decimal Score,
    string? Note,
    DateTime? UpdatedAt
);

public record SkillTopicRequest(
    int CourseId,
    string Name,
    int OrderIndex
);

public record SkillTopicListResponse(
    string Status,
    SkillTopicListData Data
);

public record SkillTopicListData(
    List<SkillTopicItem> Topics
);

public record SkillTopicItem(
    int Id,
    string Name,
    int OrderIndex
);

public record EnrollmentListResponse(
    string Status,
    EnrollmentListData Data
);

public record EnrollmentListData(
    List<EnrollmentItem> Enrollments
);

public record EnrollmentItem(
    int Id,
    int StudentId,
    string StudentName,
    int CourseId,
    string CourseName,
    int SessionsRemaining,
    decimal PaidAmount,
    DateTime? ExpiresAt,
    DateTime CreatedAt
);
