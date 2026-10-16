using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IFileUploadService
{
    Task<FileUploadResponse> UploadLogoAsync(int instituteId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadPaymentSlipAsync(int instituteId, long paymentId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadPaymentBatchSlipAsync(int instituteId, long batchId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadHomeworkAsync(int instituteId, int homeworkId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadHomeworkSubmissionAsync(int instituteId, int submissionId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadStudentPhotoAsync(int instituteId, int studentId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadTeacherPhotoAsync(int instituteId, int teacherId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadWebsiteMediaAsync(int instituteId, IFormFile file, CancellationToken ct);
}