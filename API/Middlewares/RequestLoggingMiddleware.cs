namespace academy_API.Middlewares;

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    private readonly RequestDelegate _next = next;
    private readonly ILogger<RequestLoggingMiddleware> _logger = logger;

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation(
            "Request {Method} {Path} started at {StartTime}",
            context.Request.Method,
            context.Request.Path,
            startTime);

        await _next(context);

        var duration = DateTime.UtcNow - startTime;
        _logger.LogInformation(
            "Request {Method} {Path} completed in {DurationMs}ms with status {StatusCode}",
            context.Request.Method,
            context.Request.Path,
            duration.TotalMilliseconds,
            context.Response.StatusCode);
    }
}
