namespace academy_API.Services.Interface;

public interface IStudentCardService
{
    Task<byte[]> RenderAsync(int studentId, CancellationToken ct = default);
    Task<string> GenerateAsync(int studentId, CancellationToken ct = default);
}