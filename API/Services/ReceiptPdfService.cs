using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace academy_API.Services;

public interface IReceiptPdfService
{
    byte[] Render(ReceiptPdfData data);
}

public sealed record ReceiptPdfData(
    string InvoiceNo,
    string StudentName,
    string CourseName,
    decimal Amount,
    string Method,
    DateTime PaidAt);

public sealed class ReceiptPdfService : IReceiptPdfService
{
    public byte[] Render(ReceiptPdfData data)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(document => document.Page(page =>
        {
            page.Margin(42);
            page.Size(PageSizes.A5);
            page.DefaultTextStyle(style => style.FontSize(10));
            page.Content().Column(column =>
            {
                column.Spacing(10);
                column.Item().Text("TiwHub Academy").FontSize(22).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text("Payment Receipt").FontSize(14).Bold();
                column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                column.Item().Text($"Invoice: {data.InvoiceNo}");
                column.Item().Text($"Paid at: {data.PaidAt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)} UTC");
                column.Item().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(1);
                    });
                    table.Cell().Text("Student").Bold();
                    table.Cell().Text(data.StudentName);
                    table.Cell().Text("Course").Bold();
                    table.Cell().Text(data.CourseName);
                    table.Cell().Text("Method").Bold();
                    table.Cell().Text(data.Method);
                    table.Cell().Text("Amount").Bold();
                    table.Cell().AlignRight().Text(data.Amount.ToString("N2", CultureInfo.InvariantCulture));
                });
                column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                column.Item().AlignRight().Text($"Total: {data.Amount.ToString("N2", CultureInfo.InvariantCulture)}").FontSize(16).Bold();
                column.Item().PaddingTop(18).Text("This receipt was generated electronically.").FontColor(Colors.Grey.Darken1);
            });
        })).GeneratePdf();
    }
}
