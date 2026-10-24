namespace academy_API.Services.Interface;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task UploadPrivateAsync(Stream fileStream, string key, string contentType, CancellationToken ct = default);
    string GetSignedUrl(string key, string contentType, string fileName, TimeSpan lifetime);
    Task<bool> DeleteAsync(string key, FileVisibility visibility, CancellationToken ct = default);
}

public enum FileVisibility
{
    Public,
    Private
}