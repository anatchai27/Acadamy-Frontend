using academy_API.Models;

namespace academy_API.DTOs;

public sealed record ParentDashboardSnapshot(
    int TodayAttendance,
    int PendingHomework,
    decimal OutstandingBalance,
    decimal? LatestSkillScore,
    List<ChildSummary> Children);

public sealed record ParentPayableBalance(
    int EnrollmentId,
    int StudentId,
    string StudentName,
    string CourseName,
    decimal AmountDue,
    string InstituteName,
    string? InstituteContactPhone,
    string? BankName = null,
    string? BankAccountName = null,
    string? BankAccountNumber = null,
    string? PromptPayId = null,
    string? PaymentInstructions = null,
    string? PaymentQrImageUrl = null);

public record ChildSummary(int Id, string FullName, string Grade, int InstituteId);
public record UpdateParentProfileRequest(string? FullName, string? Phone, string? Email);
public record ParentSessionItem(int Id, int CourseId, string CourseName, DateTime ScheduledAt, int DurationMin, string? RoomId, string Status, string? CourseNameEn = null);
public record AttendanceRecord(string CourseName, DateTime ScheduledAt, string Status, DateTime CheckinAt, DateTime CheckoutAt, string? CourseNameEn = null);
public record PaymentListItem(long Id, string InvoiceNo, string CourseName, decimal Amount, DateTime PaidAt, string SlipUrl, string? ReceiptPdfUrl, string? CourseNameEn = null, string Status = PaymentStatus.Pending, long? BatchId = null, string? InstituteName = null, string? InstituteContactPhone = null, string? BankName = null, string? BankAccountName = null, string? BankAccountNumber = null, string? PromptPayId = null, string? PaymentInstructions = null, string? PaymentQrImageUrl = null);
public record ParentSkillScoreItem(string CourseName, string TopicName, decimal Score, string Note, string? CourseNameEn = null, string? TopicNameEn = null);
public record ParentHomeworkItem(long Id, long HomeworkId, string CourseName, string Title, string Description, DateTime DueAt, string FileUrl, long? SubmissionId, DateTime? SubmittedAt, decimal? Score, string Feedback, string? CourseNameEn = null, string? TitleEn = null, string? DescriptionEn = null);
public record ParentProgressResponse(int CurrentStreak, int LongestStreak, List<ParentBadgeItem> Badges);
public record ParentBadgeItem(int Id, string BadgeKey, string Name, string? Description, string? IconUrl, DateTime AwardedAt, string? NameEn = null, string? DescriptionEn = null);
public record ParentLeaveRequestItem(long Id, string CourseName, string Reason, string Type, string Status, DateTime CreatedAt, string? CourseNameEn = null);