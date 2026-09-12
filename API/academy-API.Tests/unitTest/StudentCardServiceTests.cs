using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Interface;
using Moq;

namespace academy_API.Tests.unitTest;

public class StudentCardServiceTests
{
    [Fact]
    public async Task GenerateAsync_StudentNotFound_ThrowsNotFound()
    {
        // Arrange
        var repository = new Mock<IStudentRepository>();
        repository.Setup(x => x.GetStudentCardAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((Student?)null);
        var sut = new StudentCardService(repository.Object, Mock.Of<IStudentCardPdfService>(), Mock.Of<IFileStorageService>());

        // Act
        var exception = await Assert.ThrowsAsync<StudentValidationException>(() => sut.GenerateAsync(99));

        // Assert
        Assert.Equal("NOT_FOUND", exception.ErrorCode);
    }

    [Fact]
    public async Task GenerateAsync_ValidStudent_RendersAndUploadsPdf()
    {
        // Arrange
        var repository = new Mock<IStudentRepository>();
        var pdf = new Mock<IStudentCardPdfService>();
        var storage = new Mock<IFileStorageService>();
        repository.Setup(x => x.GetStudentCardAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 10, InstituteId = 1, FullName = "สมชาย", QrToken = "qr-token", QrTokenExpiresAt = DateTime.UtcNow.AddMinutes(1) });
        pdf.Setup(x => x.Render(It.Is<StudentCardPdfData>(data => data.StudentId == 10 && data.QrToken == "qr-token"))).Returns([1, 2, 3]);
        storage.Setup(x => x.UploadAsync(It.IsAny<Stream>(), "student-cards/1/10.pdf", "application/pdf", It.IsAny<CancellationToken>())).ReturnsAsync("https://storage.test/student-card.pdf");
        var sut = new StudentCardService(repository.Object, pdf.Object, storage.Object);

        // Act
        var result = await sut.GenerateAsync(10);

        // Assert
        Assert.Equal("https://storage.test/student-card.pdf", result);
        pdf.Verify(x => x.Render(It.IsAny<StudentCardPdfData>()), Times.Once);
        storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), "student-cards/1/10.pdf", "application/pdf", It.IsAny<CancellationToken>()), Times.Once);
    }
}
