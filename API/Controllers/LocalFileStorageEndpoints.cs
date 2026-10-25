using academy_API.Services;

namespace academy_API.Controllers;

public static class LocalFileStorageEndpoints
{
    public static IEndpointRouteBuilder MapLocalFileStorageEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/storage/private/{**key}", async (
            string key,
            long expires,
            string signature,
            string contentType,
            string fileName,
            LocalFileStorageService storage,
            CancellationToken ct) =>
        {
            var stream = await storage.OpenSignedPrivateAsync(key, expires, signature, contentType, fileName, ct);
            return stream is null
                ? Results.NotFound()
                : Results.File(stream, contentType, fileName, enableRangeProcessing: true);
        })
        .AllowAnonymous()
        .WithTags("Local File Storage")
        .WithName("DownloadLocalPrivateFile");

        return app;
    }
}
