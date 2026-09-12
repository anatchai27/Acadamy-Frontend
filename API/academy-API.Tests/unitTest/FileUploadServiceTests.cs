using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Interface;
using Microsoft.AspNetCore.Http;
using Moq;

namespace academy_API.Tests.unitTest;

public class FileUploadServiceTests
{
    [Fact]
    public async Task UploadStudentPhoto_ValidImage_UpdatesStudentPhotoUrl()
    {
        // Arrange
        var repository = new Mock<IFileUploadRepository>();
        var storage = new Mock<IFileStorageService>();
        repository.Setup(x => x.GetStudentAsync(10, 1, It.IsAny<CancellationToken>())).ReturnsAsync(new Student { Id = 10, InstituteId = 1 });
        storage.Setup(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), "image/png", It.IsAny<CancellationToken>())).ReturnsAsync("https://storage.test/student.png");
        var sut = new FileUploadService(repository.Object, storage.Object);
        var file = CreateFile("photo.png", "image/png", 10);

        // Act
        var result = await sut.UploadStudentPhotoAsync(1, 10, file, CancellationToken.None);

        // Assert
        Assert.Equal("https://storage.test/student.png", result.FileUrl);
        repository.Verify(x => x.SaveAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadStudentPhoto_WrongContentType_RejectsBeforeStorage()
    {
        // Arrange
        var repository = new Mock<IFileUploadRepository>();
        var storage = new Mock<IFileStorageService>();
        var sut = new FileUploadService(repository.Object, storage.Object);
        var file = CreateFile("photo.txt", "text/plain", 10);

        // Act
        var exception = await Assert.ThrowsAsync<FileUploadValidationException>(() => sut.UploadStudentPhotoAsync(1, 10, file, CancellationToken.None));

        // Assert
        Assert.Equal("FILE_TYPE_NOT_ALLOWED", exception.Code);
        storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UploadPaymentSlip_PaymentOutsideTenant_ReturnsNotFoundBeforeStorage()
    {
        // Arrange
        var repository = new Mock<IFileUploadRepository>();
        var storage = new Mock<IFileStorageService>();
        repository.Setup(x => x.GetPaymentAsync(20, 1, It.IsAny<CancellationToken>())).ReturnsAsync((Payment?)null);
        var sut = new FileUploadService(repository.Object, storage.Object);
        var file = CreateFile("slip.png", "image/png", 10);

        // Act
        var exception = await Assert.ThrowsAsync<FileUploadValidationException>(() => sut.UploadPaymentSlipAsync(1, 20, file, CancellationToken.None));

        // Assert
        Assert.Equal("NOT_FOUND", exception.Code);
        storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UploadLogo_Over2Mb_RejectsBeforeStorage()
    {
        // Arrange
        var repository = new Mock<IFileUploadRepository>();
        var storage = new Mock<IFileStorageService>();
        var sut = new FileUploadService(repository.Object, storage.Object);
        var file = CreateFile("logo.png", "image/png", 2 * 1024 * 1024 + 1);

        // Act
        var exception = await Assert.ThrowsAsync<FileUploadValidationException>(() => sut.UploadLogoAsync(1, file, CancellationToken.None));

        // Assert
        Assert.Equal("FILE_TOO_LARGE", exception.Code);
        storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static FormFile CreateFile(string name, string contentType, int length)
    {
        var stream = new MemoryStream(new byte[length]);
        return new FormFile(stream, 0, length, "file", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
