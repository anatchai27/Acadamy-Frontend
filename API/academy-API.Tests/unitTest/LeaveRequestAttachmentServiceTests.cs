using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Interface;
using Microsoft.AspNetCore.Http;
using Moq;

namespace academy_API.Tests.unitTest;

public class LeaveRequestAttachmentServiceTests
{
    [Fact]
    public async Task UploadAsync_ValidPdf_StoresMetadataAndReturnsUrl()
    {
        // Arrange
        var repository = new Mock<ILeaveRequestRepository>();
        var storage = new Mock<IFileStorageService>();
        repository.Setup(x => x.CanAccessAsync(10, 7, true, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        storage.Setup(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), "application/pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://storage.test/leave.pdf");
        repository.Setup(x => x.AddAttachmentAsync(It.IsAny<LeaveRequestAttachment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((LeaveRequestAttachment attachment, CancellationToken _) => { attachment.Id = 99; return attachment; });
        var sut = new LeaveRequestAttachmentService(repository.Object, storage.Object);
        await using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        var file = new FormFile(stream, 0, stream.Length, "file", "medical.pdf") { Headers = new HeaderDictionary(), ContentType = "application/pdf" };

        // Act
        var result = await sut.UploadAsync(10, 7, true, 1, file);

        // Assert
        Assert.Equal(99, result.Id);
        Assert.Equal("https://storage.test/leave.pdf", result.StorageUrl);
        repository.Verify(x => x.AddAttachmentAsync(It.Is<LeaveRequestAttachment>(a =>
            a.LeaveRequestId == 10 && a.InstituteId == 1 && a.ContentType == "application/pdf" && a.FileSizeBytes == 3), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadAsync_ExecutableContentType_RejectsBeforeStorage()
    {
        // Arrange
        var repository = new Mock<ILeaveRequestRepository>();
        var storage = new Mock<IFileStorageService>();
        var sut = new LeaveRequestAttachmentService(repository.Object, storage.Object);
        await using var stream = new MemoryStream(new byte[] { 1 });
        var file = new FormFile(stream, 0, stream.Length, "file", "script.exe") { Headers = new HeaderDictionary(), ContentType = "application/octet-stream" };

        // Act
        var exception = await Assert.ThrowsAsync<LeaveAttachmentValidationException>(() => sut.UploadAsync(10, 7, true, 1, file));

        // Assert
        Assert.Equal("FILE_TYPE_NOT_ALLOWED", exception.Code);
        storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UploadAsync_ParentDoesNotOwnLeaveRequest_RejectsBeforeStorage()
    {
        // Arrange
        var repository = new Mock<ILeaveRequestRepository>();
        var storage = new Mock<IFileStorageService>();
        repository.Setup(x => x.CanAccessAsync(10, 7, true, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var sut = new LeaveRequestAttachmentService(repository.Object, storage.Object);
        await using var stream = new MemoryStream(new byte[] { 1 });
        var file = new FormFile(stream, 0, stream.Length, "file", "medical.pdf") { Headers = new HeaderDictionary(), ContentType = "application/pdf" };

        // Act
        var exception = await Assert.ThrowsAsync<LeaveAttachmentValidationException>(() => sut.UploadAsync(10, 7, true, 1, file));

        // Assert
        Assert.Equal("FORBIDDEN", exception.Code);
        storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UploadAsync_FileOver5Mb_RejectsBeforeOwnershipQuery()
    {
        // Arrange
        var repository = new Mock<ILeaveRequestRepository>();
        var storage = new Mock<IFileStorageService>();
        var sut = new LeaveRequestAttachmentService(repository.Object, storage.Object);
        await using var stream = new MemoryStream(new byte[5 * 1024 * 1024 + 1]);
        var file = new FormFile(stream, 0, stream.Length, "file", "medical.pdf") { Headers = new HeaderDictionary(), ContentType = "application/pdf" };

        // Act
        var exception = await Assert.ThrowsAsync<LeaveAttachmentValidationException>(() => sut.UploadAsync(10, 7, true, 1, file));

        // Assert
        Assert.Equal("FILE_TOO_LARGE", exception.Code);
        repository.Verify(x => x.CanAccessAsync(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
