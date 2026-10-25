using System.Security.Cryptography;
using System.Text;
using academy_API.Services.Interface;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace academy_API.Services;

public sealed class LocalFileStorageOptions
{
    public const string SectionName = "LocalFileStorage";

    public string RootPath { get; set; } = "/var/lib/tiwhub-storage";
    public string SigningKey { get; set; } = string.Empty;
    public string PublicUrlPrefix { get; set; } = "/uploads";
}

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly string _publicRoot;
    private readonly string _privateRoot;
    private readonly byte[] _signingKey;
    private readonly string _publicUrlPrefix;

    public LocalFileStorageService(IOptions<LocalFileStorageOptions> options)
    {
        var config = options.Value;
        if (string.IsNullOrWhiteSpace(config.RootPath))
            throw new InvalidOperationException("Local file storage requires a persistent root path.");
        if (string.IsNullOrWhiteSpace(config.SigningKey))
            throw new InvalidOperationException("Local file storage requires LocalFileStorage:SigningKey to sign private download URLs.");

        _signingKey = Encoding.UTF8.GetBytes(config.SigningKey);
        if (_signingKey.Length < 32)
            throw new InvalidOperationException("LocalFileStorage:SigningKey must be at least 32 bytes.");

        var root = Path.GetFullPath(config.RootPath);
        _publicRoot = Path.Combine(root, "public");
        _privateRoot = Path.Combine(root, "private");
        var publicUrlPrefix = config.PublicUrlPrefix.Trim().Trim('/');
        _publicUrlPrefix = string.IsNullOrEmpty(publicUrlPrefix) ? string.Empty : $"/{publicUrlPrefix}";
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var path = ResolvePath(_publicRoot, fileName);
        await WriteAsync(fileStream, path, ct);
        var escapedKey = string.Join('/', fileName.Split('/').Select(Uri.EscapeDataString));
        return $"{_publicUrlPrefix}/{escapedKey}";
    }

    public async Task UploadPrivateAsync(Stream fileStream, string key, string contentType, CancellationToken ct = default)
    {
        var path = ResolvePath(_privateRoot, key);
        await WriteAsync(fileStream, path, ct);
    }

    public string GetSignedUrl(string key, string contentType, string fileName, TimeSpan lifetime)
    {
        if (lifetime <= TimeSpan.Zero || lifetime > TimeSpan.FromHours(1))
            throw new ArgumentOutOfRangeException(nameof(lifetime), "Private download links must expire within one hour.");

        var normalizedKey = NormalizeKey(key);
        var expires = DateTimeOffset.UtcNow.Add(lifetime).ToUnixTimeSeconds();
        var signature = Sign(normalizedKey, expires, contentType, fileName);
        var escapedKey = string.Join('/', normalizedKey.Split('/').Select(Uri.EscapeDataString));
        var query = QueryString.Create(new Dictionary<string, string?>
        {
            ["expires"] = expires.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["signature"] = signature,
            ["contentType"] = contentType,
            ["fileName"] = fileName,
        });
        return $"/api/storage/private/{escapedKey}{query}";
    }

    public async Task<Stream?> OpenSignedPrivateAsync(
        string key,
        long expires,
        string signature,
        string contentType,
        string fileName,
        CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (expires <= now || expires > now + (long)TimeSpan.FromHours(1).TotalSeconds)
            return null;

        string normalizedKey;
        try
        {
            normalizedKey = NormalizeKey(key);
        }
        catch (ArgumentException)
        {
            return null;
        }

        if (!IsValidSignature(signature, Sign(normalizedKey, expires, contentType, fileName)))
            return null;

        var path = ResolvePath(_privateRoot, normalizedKey);
        ct.ThrowIfCancellationRequested();
        try
        {
            return new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, FileOptions.Asynchronous | FileOptions.SequentialScan);
        }
        catch (FileNotFoundException)
        {
            return null;
        }
        catch (DirectoryNotFoundException)
        {
            return null;
        }
    }

    public Task<bool> DeleteAsync(string key, FileVisibility visibility, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        var root = visibility == FileVisibility.Private ? _privateRoot : _publicRoot;
        var path = ResolvePath(root, key);
        if (!File.Exists(path)) return Task.FromResult(false);
        File.Delete(path);
        return Task.FromResult(true);
    }

    private static async Task WriteAsync(Stream source, string path, CancellationToken ct)
    {
        var directory = Path.GetDirectoryName(path)!;
        Directory.CreateDirectory(directory);
        var tempPath = Path.Combine(directory, $".{Guid.NewGuid():N}.tmp");
        try
        {
            await using (var destination = new FileStream(tempPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 64 * 1024, FileOptions.Asynchronous | FileOptions.SequentialScan))
            {
                await source.CopyToAsync(destination, ct);
                await destination.FlushAsync(ct);
            }
            File.Move(tempPath, path, true);
        }
        finally
        {
            if (File.Exists(tempPath)) File.Delete(tempPath);
        }
    }

    private string Sign(string key, long expires, string contentType, string fileName)
    {
        var payload = $"{key}\n{expires}\n{contentType}\n{fileName}";
        return Convert.ToHexString(HMACSHA256.HashData(_signingKey, Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    private static bool IsValidSignature(string supplied, string expected)
    {
        try
        {
            var suppliedBytes = Convert.FromHexString(supplied);
            var expectedBytes = Convert.FromHexString(expected);
            return suppliedBytes.Length == expectedBytes.Length && CryptographicOperations.FixedTimeEquals(suppliedBytes, expectedBytes);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string ResolvePath(string root, string key)
    {
        var normalizedKey = NormalizeKey(key);
        var fullPath = Path.GetFullPath(Path.Combine(root, normalizedKey.Replace('/', Path.DirectorySeparatorChar)));
        var rootWithSeparator = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if (!fullPath.StartsWith(rootWithSeparator, OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal))
            throw new ArgumentException("Invalid storage key.", nameof(key));
        return fullPath;
    }

    private static string NormalizeKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Contains('\\') || Path.IsPathRooted(key))
            throw new ArgumentException("Invalid storage key.", nameof(key));

        var segments = key.Split('/');
        if (segments.Any(segment => string.IsNullOrWhiteSpace(segment)
            || segment is "." or ".."
            || segment.Any(character => !char.IsAsciiLetterOrDigit(character) && character is not '-' and not '_' and not '.')))
            throw new ArgumentException("Invalid storage key.", nameof(key));
        return string.Join('/', segments);
    }
}
