using System.Text;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IStudentExportService
{
    Task<byte[]> ExportCsvAsync(CancellationToken ct = default);
}

public sealed class StudentExportService(IStudentRepository repository) : IStudentExportService
{
    public async Task<byte[]> ExportCsvAsync(CancellationToken ct = default)
    {
        await using var stream = new MemoryStream();
        await using var writer = new StreamWriter(stream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true), leaveOpen: true);
        await writer.WriteLineAsync("id,full_name,nickname,grade,school,primary_parent_name,primary_parent_phone,medical_info,photo_url");

        await foreach (var row in repository.StreamExportAsync(ct).WithCancellation(ct))
        {
            await writer.WriteLineAsync(string.Join(',',
                Csv(row.Id), Csv(row.FullName), Csv(row.Nickname), Csv(row.Grade), Csv(row.School),
                Csv(row.PrimaryParentName), Csv(row.PrimaryParentPhone), Csv(row.MedicalInfo), Csv(row.PhotoUrl)));
        }

        await writer.FlushAsync(ct);
        return stream.ToArray();
    }

    private static string Csv(object? value)
    {
        var text = Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
        return $"\"{text.Replace("\"", "\"\"")}\"";
    }
}