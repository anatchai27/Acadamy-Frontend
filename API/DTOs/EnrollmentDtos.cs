namespace academy_API.DTOs;

public record EnrollStudentRequest(
    int StudentId,
    int CourseId
);

public record EnrollStudentResponse(
    string Status,
    string Message,
    EnrollStudentData Data
);

public record EnrollStudentData(
    int EnrollmentId,
    int SessionsRemaining,
    DateTime ExpiresAt
);
