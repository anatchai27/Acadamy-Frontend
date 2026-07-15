namespace academy_API.DTOs;

public record CreateStudentRequest(
    StudentInfo Student,
    List<ParentInfo> Parents,
    PdpaInfo Pdpa
);

public record StudentInfo(
    string FullName,
    string? Nickname,
    string? Grade,
    string? School,
    string? PhotoUrl,
    string? MedicalInfo
);

public record ParentInfo(
    string FullName,
    string? Phone,
    string? Relationship
);

public record PdpaInfo(
    bool IsAccepted,
    string? ConsentVersion
);

public record CreateStudentResponse(
    string Status,
    string Message,
    CreateStudentData Data
);

public record CreateStudentData(
    int StudentId,
    string QrToken,
    DateTime CreatedAt
);

public record StudentResponse(
    int Id,
    int? UserId,
    string FullName,
    string? Nickname,
    string? Grade,
    string? School,
    string? QrToken,
    string? PhotoUrl,
    string? MedicalInfo,
    DateTime CreatedAt
);

public record StudentErrorResponse(
    string Status,
    string ErrorCode,
    string Message
);

public record StudentListResponse(
    string Status,
    StudentListData Data
);

public record StudentListData(
    List<StudentListItem> Students,
    PaginationInfo Pagination
);

public record StudentListItem(
    int Id,
    string FullName,
    string? Nickname,
    string? Grade,
    string? PhotoUrl,
    string? PrimaryParentName,
    string? PrimaryParentPhone
);

public record PaginationInfo(
    int CurrentPage,
    int TotalPages,
    int TotalItems,
    bool HasNext
);

public record StudentProfileResponse(
    string Status,
    StudentProfileData Data
);

public record StudentProfileData(
    int Id,
    string FullName,
    string? Nickname,
    string? Grade,
    string? School,
    string? MedicalInfo,
    string? PhotoUrl,
    DateTime CreatedAt,
    List<ParentProfileInfo> Parents
);

public record ParentProfileInfo(
    int Id,
    string FullName,
    string? Phone,
    string? Relationship,
    string? LineUserId
);

public record UpdateStudentRequest(
    StudentUpdate? Student,
    List<ParentUpdate>? Parents
);

public record StudentUpdate(
    string? FullName,
    string? Nickname,
    string? Grade,
    string? School,
    string? PhotoUrl,
    string? MedicalInfo
);

public record ParentUpdate(
    int Id,
    string? FullName,
    string? Phone,
    string? Relationship,
    string? LineUserId
);

public record UpdateStudentResponse(
    string Status,
    string Message
);

public record QrTokenResponse(
    string Status,
    QrTokenData Data
);

public record QrTokenData(
    int StudentId,
    string QrToken,
    DateTime ExpiresAt,
    int RefreshIntervalSec
);
