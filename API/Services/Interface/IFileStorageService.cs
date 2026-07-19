namespace academy_API.Services.Interface;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task<bool> DeleteAsync(string fileUrl, CancellationToken ct = default);
    string GetPublicUrl(string key);
}