using academy_API.DTOs;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class StudentExportServiceTests
{
    [Fact]
    public async Task ExportCsvAsync_EmptyDataset_ReturnsHeaderOnly()
    {
        // Arrange
        var repository = new Mock<IStudentRepository>();
        repository.Setup(x => x.StreamExportAsync(It.IsAny<CancellationToken>()))
            .Returns(EmptyRows());
        var sut = new StudentExportService(repository.Object);

        // Act
        var bytes = await sut.ExportCsvAsync();
        var csv = System.Text.Encoding.UTF8.GetString(bytes);

        // Assert
        Assert.Contains("id,full_name,nickname", csv);
        Assert.Single(csv.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries));
    }

    [Fact]
    public async Task ExportCsvAsync_EscapesCommasQuotesAndNewlines()
    {
        // Arrange
        var repository = new Mock<IStudentRepository>();
        repository.Setup(x => x.StreamExportAsync(It.IsAny<CancellationToken>()))
            .Returns(Row(new StudentExportRow(1, "สมชาย, \"รักเรียน\"", null, "ม.1", "โรงเรียน\nเดิม", null, null, null, null)));
        var sut = new StudentExportService(repository.Object);

        // Act
        var csv = System.Text.Encoding.UTF8.GetString(await sut.ExportCsvAsync());

        // Assert
        Assert.Contains("\"สมชาย, \"\"รักเรียน\"\"\"", csv);
        Assert.Contains("\"โรงเรียน\nเดิม\"", csv);
    }

    private static async IAsyncEnumerable<StudentExportRow> EmptyRows()
    {
        await Task.CompletedTask;
        yield break;
    }

    private static async IAsyncEnumerable<StudentExportRow> Row(StudentExportRow row)
    {
        await Task.CompletedTask;
        yield return row;
    }
}
