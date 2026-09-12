using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;

namespace academy_API.Services;

public interface IStudentCardPdfService
{
    byte[] Render(StudentCardPdfData data);
}

public sealed record StudentCardPdfData(
    int StudentId,
    string FullName,
    string? Nickname,
    string? Grade,
    string? School,
    string? MedicalInfo,
    string QrToken,
    DateTime? QrExpiresAt);

public sealed class StudentCardPdfService : IStudentCardPdfService
{
    public byte[] Render(StudentCardPdfData data)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(data.QrToken, QRCodeGenerator.ECCLevel.Q);
        var qrBytes = new PngByteQRCode(qrData).GetGraphic(8);
        return Document.Create(document => document.Page(page =>
        {
            page.Margin(28);
            page.Size(PageSizes.A6);
            page.DefaultTextStyle(style => style.FontSize(9));
            page.Content().Column(column =>
            {
                column.Spacing(8);
                column.Item().Text("TiwHub Academy").FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text("Student Card").FontSize(12).Bold();
                column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                column.Item().AlignCenter().Width(130).Height(130).Image(qrBytes);
                column.Item().AlignCenter().Text(data.FullName).FontSize(16).Bold();
                if (!string.IsNullOrWhiteSpace(data.Nickname)) column.Item().AlignCenter().Text($"({data.Nickname})");
                column.Item().Text($"Student ID: {data.StudentId}").Bold();
                column.Item().Text($"Grade: {data.Grade ?? "-"}");
                column.Item().Text($"School: {data.School ?? "-"}");
                if (!string.IsNullOrWhiteSpace(data.MedicalInfo)) column.Item().Text($"Medical: {data.MedicalInfo}");
                column.Item().Text($"QR expires: {(data.QrExpiresAt?.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture) ?? "-")} UTC").FontColor(Colors.Grey.Darken1);
            });
        })).GeneratePdf();
    }
}
