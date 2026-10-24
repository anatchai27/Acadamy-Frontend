using Aliyun.OSS;
using Aliyun.OSS.Common;
using Microsoft.Extensions.Options;
using academy_API.Services.Interface;

namespace academy_API.Services;

public sealed class AliyunOssFileStorageService : IFileStorageService, IDisposable
{
    private readonly OssClient? _ossClient;
    private readonly string _bucketName;
    private readonly string _publicUrl;

    public AliyunOssFileStorageService(IOptions<ThaiDataCloudOptions> options)
    {
        var config = options.Value;
        _bucketName = config.BucketName;
        _publicUrl = config.PublicUrl.TrimEnd('/');

        if (!string.IsNullOrWhiteSpace(config.ServiceUrl)
            && !string.IsNullOrWhiteSpace(config.AccessKey)
            && !string.IsNullOrWhiteSpace(config.SecretKey)
            && !string.IsNullOrWhiteSpace(config.BucketName))
        {
            var ossConfig = new ClientConfiguration();
            _ossClient = new OssClient(config.ServiceUrl, config.AccessKey, config.SecretKey, ossConfig);
        }
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        if (_ossClient is null)
            throw new InvalidOperationException("Thai Data Cloud storage is not configured.");

        await using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, ct);
        buffer.Position = 0;

        var objectMeta = new ObjectMetadata { ContentType = contentType };
        await Task.Run(() => _ossClient.PutObject(_bucketName, fileName, buffer, objectMeta), ct);
        return $"{_publicUrl}/{_bucketName}/{fileName}";
    }

    public async Task UploadPrivateAsync(Stream fileStream, string key, string contentType, CancellationToken ct = default)
    {
        if (_ossClient is null)
            throw new InvalidOperationException("Thai Data Cloud storage is not configured.");

        await using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, ct);
        buffer.Position = 0;
        var metadata = new ObjectMetadata { ContentType = contentType };
        await Task.Run(() => _ossClient.PutObject(_bucketName, key, buffer, metadata), ct);
        await Task.Run(() => _ossClient.SetObjectAcl(new SetObjectAclRequest(_bucketName, key, CannedAccessControlList.Private)), ct);
    }

    public string GetSignedUrl(string key, string contentType, string fileName, TimeSpan lifetime)
    {
        if (_ossClient is null)
            throw new InvalidOperationException("Thai Data Cloud storage is not configured.");

        var request = new GeneratePresignedUriRequest(_bucketName, key, SignHttpMethod.Get)
        {
            Expiration = DateTime.UtcNow.Add(lifetime),
            ResponseHeaders = new ResponseHeaderOverrides
            {
                ContentType = contentType,
                ContentDisposition = $"attachment; filename*=UTF-8''{Uri.EscapeDataString(fileName)}"
            }
        };
        return _ossClient.GeneratePresignedUri(request).ToString();
    }

    public async Task<bool> DeleteAsync(string key, FileVisibility visibility, CancellationToken ct = default)
    {
        if (_ossClient is null)
            throw new InvalidOperationException("Thai Data Cloud storage is not configured.");

        var result = await Task.Run(() => _ossClient.DeleteObject(_bucketName, key), ct);
        return result.HttpStatusCode == System.Net.HttpStatusCode.NoContent;
    }

    public string GetPublicUrl(string key) => $"{_publicUrl}/{_bucketName}/{key}";

    public void Dispose() { }
}

public sealed class ThaiDataCloudOptions
{
    public const string SectionName = "ThaiDataCloud";
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
}