using academy_API.DTOs;
using academy_API.Repositories;
using academy_API.Services.Interface;

namespace academy_API.Services;

public interface IFileUploadService
{
    Task<FileUploadResponse> UploadLogoAsync(int instituteId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadPaymentSlipAsync(int instituteId, long paymentId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadHomeworkAsync(int instituteId, int homeworkId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadHomeworkSubmissionAsync(int instituteId, int submissionId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadStudentPhotoAsync(int instituteId, int studentId, IFormFile file, CancellationToken ct);
    Task<FileUploadResponse> UploadTeacherPhotoAsync(int instituteId, int teacherId, IFormFile file, CancellationToken ct);
}

public sealed class FileUploadService(IFileUploadRepository repository, IFileStorageService storage) : IFileUploadService
{
    public async Task<FileUploadResponse> UploadLogoAsync(int instituteId, IFormFile file, CancellationToken ct)
    {
        ValidateFile(file, 2, true);
        if (!await repository.InstituteExistsAsync(instituteId, ct)) throw new FileUploadValidationException("NOT_FOUND", "Institute not found.");
        return await UploadAsync(file, 2, true, $"logos/institute_{instituteId}_{DateTime.UtcNow:yyyyMMddHHmmss}", "logo", Task.FromResult, ct);
    }

    public async Task<FileUploadResponse> UploadPaymentSlipAsync(int instituteId, long paymentId, IFormFile file, CancellationToken ct)
    {
        ValidateFile(file, 5, true);
        var payment = await repository.GetPaymentAsync(paymentId, instituteId, ct) ?? throw new FileUploadValidationException("NOT_FOUND", "Payment not found.");
        return await UploadAsync(file, 5, true, $"slips/payment_{paymentId}_{DateTime.UtcNow:yyyyMMddHHmmss}", "slip", async url =>
        {
        payment.SlipUrl = url;
        await repository.SaveAsync(ct);
        return url;
        }, ct);
    }

    public Task<FileUploadResponse> UploadHomeworkAsync(int instituteId, int homeworkId, IFormFile file, CancellationToken ct) => UploadAsync(file, 10, false, $"homeworks/homework_{homeworkId}_{DateTime.UtcNow:yyyyMMddHHmmss}", "file", Task.FromResult, ct);
    public async Task<FileUploadResponse> UploadHomeworkSubmissionAsync(int instituteId, int submissionId, IFormFile file, CancellationToken ct)
    {
        ValidateFile(file, 10, false);
        var submission = await repository.GetHomeworkSubmissionAsync(submissionId, instituteId, ct)
            ?? throw new FileUploadValidationException("NOT_FOUND", "Homework submission not found.");
        return await UploadAsync(file, 10, false, $"submissions/submission_{submissionId}_{DateTime.UtcNow:yyyyMMddHHmmss}", "file", async url =>
        {
            submission.FileUrl = url;
            submission.SubmittedAt = DateTime.UtcNow;
            await repository.SaveAsync(ct);
            return url;
        }, ct);
    }

    public async Task<FileUploadResponse> UploadStudentPhotoAsync(int instituteId, int studentId, IFormFile file, CancellationToken ct)
    {
        ValidateFile(file, 5, true);
        var student = await repository.GetStudentAsync(studentId, instituteId, ct) ?? throw new FileUploadValidationException("NOT_FOUND", "Student not found.");
        return await UploadAsync(file, 5, true, $"photos/student_{studentId}_{DateTime.UtcNow:yyyyMMddHHmmss}", "photo", async url =>
        {
        student.PhotoUrl = url;
        await repository.SaveAsync(ct);
        return url;
        }, ct);
    }

    public async Task<FileUploadResponse> UploadTeacherPhotoAsync(int instituteId, int teacherId, IFormFile file, CancellationToken ct)
    {
        ValidateFile(file, 5, true);
        var teacher = await repository.GetTeacherAsync(teacherId, instituteId, ct) ?? throw new FileUploadValidationException("NOT_FOUND", "Teacher not found.");
        return await UploadAsync(file, 5, true, $"photos/teacher_{teacherId}_{DateTime.UtcNow:yyyyMMddHHmmss}", "photo", async url =>
        {
        teacher.PhotoUrl = url;
        await repository.SaveAsync(ct);
        return url;
        }, ct);
    }

    private async Task<FileUploadResponse> UploadAsync(IFormFile file, int maxMb, bool imageOnly, string keyPrefix, string fileType, Func<string, Task<string>> afterUpload, CancellationToken ct)
    {
        ValidateFile(file, maxMb, imageOnly);
        await using var stream = file.OpenReadStream();
        var url = await storage.UploadAsync(stream, keyPrefix + Path.GetExtension(file.FileName), file.ContentType, ct);
        return new FileUploadResponse("success", await afterUpload(url), fileType);
    }

    private static void ValidateFile(IFormFile file, int maxMb, bool imageOnly)
    {
        if (file is null || file.Length == 0) throw new FileUploadValidationException("FILE_REQUIRED", "No file uploaded.");
        if (imageOnly && !file.ContentType.StartsWith("image/")) throw new FileUploadValidationException("FILE_TYPE_NOT_ALLOWED", "Only image files are allowed.");
        if (file.Length > maxMb * 1024L * 1024L) throw new FileUploadValidationException("FILE_TOO_LARGE", $"File size must not exceed {maxMb}MB.");
    }
}

public sealed class FileUploadValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
