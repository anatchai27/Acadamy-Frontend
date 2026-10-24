using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using academy_API.Services.Interface;
using Microsoft.Extensions.Options;

namespace academy_API.Services;

public sealed class AzureBlobFileStorageService : IFileStorageService
{
    private readonly BlobContainerClient _publicContainer;
    private readonly BlobContainerClient _privateContainer;
    private readonly string _publicBaseUrl;

    public AzureBlobFileStorageService(IOptions<AzureBlobOptions> options)
    {
        var config = options.Value;
        if (string.IsNullOrWhiteSpace(config.ConnectionString)
            || string.IsNullOrWhiteSpace(config.PublicContainerName)
            || string.IsNullOrWhiteSpace(config.PrivateContainerName))
        {
            throw new InvalidOperationException(
                "Azure Blob storage requires a connection string and public/private container names.");
        }

        var serviceClient = new BlobServiceClient(config.ConnectionString);
        _publicContainer = serviceClient.GetBlobContainerClient(config.PublicContainerName);
        _privateContainer = serviceClient.GetBlobContainerClient(config.PrivateContainerName);
        _publicBaseUrl = string.IsNullOrWhiteSpace(config.PublicBaseUrl)
            ? _publicContainer.Uri.AbsoluteUri.TrimEnd('/')
            : config.PublicBaseUrl.TrimEnd('/');
    }

    public Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken ct = default) =>
        UploadToContainerAsync(_publicContainer, fileStream, fileName, contentType, ct);

    public async Task UploadPrivateAsync(
        Stream fileStream,
        string key,
        string contentType,
        CancellationToken ct = default)
    {
        await UploadToContainerAsync(_privateContainer, fileStream, key, contentType, ct);
    }

    public string GetSignedUrl(string key, string contentType, string fileName, TimeSpan lifetime)
    {
        var blobClient = _privateContainer.GetBlobClient(key);
        var sas = new BlobSasBuilder
        {
            BlobContainerName = _privateContainer.Name,
            BlobName = key,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(lifetime),
            ContentType = contentType,
            ContentDisposition = $"attachment; filename*=UTF-8''{Uri.EscapeDataString(fileName)}"
        };
        sas.SetPermissions(BlobSasPermissions.Read);
        return blobClient.GenerateSasUri(sas).ToString();
    }

    public async Task<bool> DeleteAsync(
        string key,
        FileVisibility visibility,
        CancellationToken ct = default)
    {
        var container = visibility == FileVisibility.Private ? _privateContainer : _publicContainer;
        var result = await container.GetBlobClient(key)
            .DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: ct);
        return result.Value;
    }

    private async Task<string> UploadToContainerAsync(
        BlobContainerClient container,
        Stream fileStream,
        string key,
        string contentType,
        CancellationToken ct)
    {
        var blobClient = container.GetBlobClient(key);
        await blobClient.UploadAsync(fileStream, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        }, ct);

        if (container == _privateContainer)
            return blobClient.Uri.AbsoluteUri;

        var escapedKey = string.Join('/', key.Split('/').Select(Uri.EscapeDataString));
        return $"{_publicBaseUrl}/{escapedKey}";
    }
}

public sealed class AzureBlobOptions
{
    public const string SectionName = "AzureBlob";

    public string ConnectionString { get; set; } = string.Empty;
    public string PublicContainerName { get; set; } = string.Empty;
    public string PrivateContainerName { get; set; } = string.Empty;
    public string? PublicBaseUrl { get; set; }
}