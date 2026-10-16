namespace academy_API.Services.Interface;

public interface IStudentExportService
{
    Task<byte[]> ExportCsvAsync(CancellationToken ct = default);
}