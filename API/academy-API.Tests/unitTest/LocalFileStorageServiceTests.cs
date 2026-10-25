using academy_API.Services;
using academy_API.Services.Interface;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace academy_API.Tests.unitTest;

public sealed class LocalFileStorageServiceTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "tiwhub-storage-tests", Guid.NewGuid().ToString("N"));
    private readonly LocalFileStorageService _sut;

    public LocalFileStorageServiceTests()
    {
        _sut = new LocalFileStorageService(Options.Create(new LocalFileStorageOptions
        {
            RootPath = _root,
            SigningKey = new string('s', 48),
        }));
    }

    [Fact]
    public async Task UploadAsync_WritesOnlyToPublicRootAndReturnsStableUrl()
    {
        await using var source = new MemoryStream([1, 2, 3]);

        var url = await _sut.UploadAsync(source, "photos/student-1.png", "image/png");

        Assert.Equal("/uploads/photos/student-1.png", url);
        Assert.Equal(new byte[] { 1, 2, 3 }, await File.ReadAllBytesAsync(Path.Combine(_root, "public", "photos", "student-1.png")));
        Assert.False(Directory.Exists(Path.Combine(_root, "private")));
    }

    [Fact]
    public async Task PrivateUpload_RequiresValidUnexpiredSignatureToOpen()
    {
        await using var source = new MemoryStream([7, 8, 9]);
        await _sut.UploadPrivateAsync(source, "course-materials/4/asset.pdf", "application/pdf");
        var signedUrl = _sut.GetSignedUrl("course-materials/4/asset.pdf", "application/pdf", "lesson notes.pdf", TimeSpan.FromMinutes(5));
        var uri = new Uri("https://example.test" + signedUrl);
        var query = QueryHelpers.ParseQuery(uri.Query);

        await using var valid = await _sut.OpenSignedPrivateAsync(
            "course-materials/4/asset.pdf",
            long.Parse(query["expires"]!),
            query["signature"]!,
            query["contentType"]!,
            query["fileName"]!);
        Assert.NotNull(valid);
        using var buffer = new MemoryStream();
        await valid!.CopyToAsync(buffer);
        Assert.Equal(new byte[] { 7, 8, 9 }, buffer.ToArray());

        var tampered = await _sut.OpenSignedPrivateAsync(
            "course-materials/4/asset.pdf",
            long.Parse(query["expires"]!),
            query["signature"]!,
            "text/plain",
            query["fileName"]!);
        Assert.Null(tampered);

        var expired = await _sut.OpenSignedPrivateAsync(
            "course-materials/4/asset.pdf",
            DateTimeOffset.UtcNow.AddMinutes(-1).ToUnixTimeSeconds(),
            query["signature"]!,
            query["contentType"]!,
            query["fileName"]!);
        Assert.Null(expired);
    }

    [Theory]
    [InlineData("../secrets.txt")]
    [InlineData("course/../../secrets.txt")]
    [InlineData("/etc/passwd")]
    [InlineData("course\\..\\secret.txt")]
    [InlineData("รูปภาพ.png")]
    public async Task UploadAsync_RejectsUnsafeObjectKeys(string key)
    {
        await using var source = new MemoryStream([1]);
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.UploadAsync(source, key, "text/plain"));
    }

    [Fact]
    public async Task DeleteAsync_UsesTheRequestedVisibilityRoot()
    {
        await using var publicSource = new MemoryStream([1]);
        await using var privateSource = new MemoryStream([2]);
        await _sut.UploadAsync(publicSource, "same/object.bin", "application/octet-stream");
        await _sut.UploadPrivateAsync(privateSource, "same/object.bin", "application/octet-stream");

        Assert.True(await _sut.DeleteAsync("same/object.bin", FileVisibility.Private));
        Assert.True(File.Exists(Path.Combine(_root, "public", "same", "object.bin")));
        Assert.False(File.Exists(Path.Combine(_root, "private", "same", "object.bin")));
    }

    [Fact]
    public void Constructor_RequiresStrongSigningKey()
    {
        Assert.Throws<InvalidOperationException>(() => new LocalFileStorageService(Options.Create(new LocalFileStorageOptions
        {
            RootPath = _root,
            SigningKey = "too-short",
        })));
    }

    public void Dispose()
    {
        if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
    }
}
