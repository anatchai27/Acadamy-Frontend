using academy_API.Repositories;
using academy_API.Services.Interface;

namespace academy_API.Services;

public interface IStudentCardService
{
    Task<string> GenerateAsync(int studentId, CancellationToken ct = default);
}

public sealed class StudentCardService(IStudentRepository repository, IStudentCardPdfService pdf, IFileStorageService storage) : IStudentCardService
{
    public async Task<string> GenerateAsync(int studentId, CancellationToken ct = default)
    {
        var student = await repository.GetStudentCardAsync(studentId, ct)
            ?? throw new StudentValidationException("NOT_FOUND", "ไม่พบข้อมูลนักเรียน");
        if (string.IsNullOrWhiteSpace(student.QrToken))
            throw new StudentValidationException("QR_NOT_FOUND", "นักเรียนยังไม่มี QR Token");

        var bytes = pdf.Render(new StudentCardPdfData(student.Id, student.FullName, student.Nickname, student.Grade, student.School, student.MedicalInfo, student.QrToken, student.QrTokenExpiresAt));
        await using var stream = new MemoryStream(bytes);
        return await storage.UploadAsync(stream, $"student-cards/{student.InstituteId}/{student.Id}.pdf", "application/pdf", ct);
    }
}