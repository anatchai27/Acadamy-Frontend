using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace academy_API.Services.Interface;

public class S3FileStorageService : IFileStorageService, IDisposable
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _publicUrl;

    public S3FileStorageService(IOptions<ThaiDataCloudOptions> options)
    {
        var config = options.Value;
        _bucketName = config.BucketName;
        _publicUrl = config.PublicUrl.TrimEnd('/');

        var s3Config = new AmazonS3Config
        {
            ServiceURL = config.ServiceUrl,
            ForcePathStyle = true
        };

        _s3Client = new AmazonS3Client(config.AccessKey, config.SecretKey, s3Config);
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var putRequest = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = fileName,
            InputStream = fileStream,
            ContentType = contentType
        };

        await _s3Client.PutObjectAsync(putRequest, ct);

        return $"{_publicUrl}/{_bucketName}/{fileName}";
    }

    public async Task<bool> DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        var key = ExtractKeyFromUrl(fileUrl);
        if (string.IsNullOrEmpty(key)) return false;

        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = key
        };

        var response = await _s3Client.DeleteObjectAsync(deleteRequest, ct);
        return response.HttpStatusCode == System.Net.HttpStatusCode.NoContent;
    }

    public string GetPublicUrl(string key) => $"{_publicUrl}/{_bucketName}/{key}";

    private string? ExtractKeyFromUrl(string url)
    {
        var prefix = $"{_publicUrl}/{_bucketName}/";
        return url.StartsWith(prefix) ? url[prefix.Length..] : null;
    }

    public void Dispose()
    {
        _s3Client?.Dispose();
    }
}

public class ThaiDataCloudOptions
{
    public const string SectionName = "ThaiDataCloud";
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
}