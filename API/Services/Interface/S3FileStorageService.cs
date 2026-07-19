using Aliyun.OSS;
using Aliyun.OSS.Common;
using Microsoft.Extensions.Options;

namespace academy_API.Services.Interface;

public class S3FileStorageService : IFileStorageService, IDisposable
{
    private readonly OssClient _ossClient;
    private readonly string _bucketName;
    private readonly string _publicUrl;

    public S3FileStorageService(IOptions<ThaiDataCloudOptions> options)
    {
        var config = options.Value;
        _bucketName = config.BucketName;
        _publicUrl = config.PublicUrl.TrimEnd('/');

        var ossConfig = new ClientConfiguration();
        _ossClient = new OssClient(config.ServiceUrl, config.AccessKey, config.SecretKey, ossConfig);
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, ct);
        buffer.Position = 0;

        var objectMeta = new ObjectMetadata
        {
            ContentType = contentType
        };

        var result = await Task.Run(() => _ossClient.PutObject(_bucketName, fileName, buffer, objectMeta), ct);

        return $"{_publicUrl}/{_bucketName}/{fileName}";
    }

    public async Task<bool> DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        var key = ExtractKeyFromUrl(fileUrl);
        if (string.IsNullOrEmpty(key)) return false;

        var result = await Task.Run(() => _ossClient.DeleteObject(_bucketName, key), ct);
        return result.HttpStatusCode == System.Net.HttpStatusCode.NoContent;
    }

    public string GetPublicUrl(string key) => $"{_publicUrl}/{_bucketName}/{key}";

    private string? ExtractKeyFromUrl(string url)
    {
        var prefix = $"{_publicUrl}/{_bucketName}/";
        return url.StartsWith(prefix) ? url[prefix.Length..] : null;
    }

    public void Dispose()
    {
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