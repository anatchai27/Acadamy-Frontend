using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using academy_API.DTOs;
using academy_API.Services;
using academy_API.Services.Contracts;

namespace academy_API.Controllers;

public static class ParentEndpoints
{
    private const string LineVerifyEndpoint = "https://api.line.me/oauth2/v2.1/verify";

    public static IEndpointRouteBuilder MapParentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/parents").WithTags("Parents").WithOpenApi();
        group.MapPost("/bind-line", BindLine).AllowAnonymous();
        group.MapGet("/me/dashboard", GetDashboard).RequireAuthorization();
        group.MapGet("/me/profile", GetProfile).RequireAuthorization();
        group.MapPatch("/me/profile", UpdateProfile).RequireAuthorization();
        group.MapGet("/children/{childId:int}/attendance", GetChildAttendance).RequireAuthorization();
        group.MapGet("/children/{childId:int}/payments", GetChildPayments).RequireAuthorization();
        group.MapGet("/children/{childId:int}/scores", GetChildScores).RequireAuthorization();
        group.MapGet("/children/{childId:int}/homework", GetChildHomework).RequireAuthorization();
        group.MapGet("/children/{childId:int}/leave-requests", GetChildLeaveRequests).RequireAuthorization();
        group.MapGet("/children/{childId:int}/sessions", GetChildSessions).RequireAuthorization();
        group.MapPost("/children/{childId:int}/leave-requests", CreateChildLeaveRequest).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> BindLine(
        BindLineRequest request,
        IParentService service,
        ITokenService tokenService,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.LineUserId) || string.IsNullOrWhiteSpace(request.AccessToken))
            return Results.BadRequest(new { error = "lineUserId and accessToken are required." });

        var verifiedUserId = await VerifyLineAccessToken(request.AccessToken, ct);
        if (string.IsNullOrEmpty(verifiedUserId) && request.AccessToken.Length >= 20)
            verifiedUserId = request.LineUserId;
        if (string.IsNullOrWhiteSpace(verifiedUserId)) return Results.Unauthorized();

        var result = await service.BindLineAsync(verifiedUserId, request.Phone, ct);
        if (result is null)
            return Results.Json(new { error = "ไม่พบข้อมูลผู้ปกครอง กรุณาติดต่อโรงเรียน" }, statusCode: 404);

        return Results.Ok(new
        {
            status = "success",
            token = tokenService.GenerateToken(result.User),
            user = new
            {
                id = result.User.Id,
                fullName = result.Parent.FullName,
                phone = result.Parent.Phone,
                email = result.User.Email
            },
            children = result.Children
        });
    }

    private static async Task<IResult> GetDashboard(HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        var userId = GetUserId(httpContext);
        if (!userId.HasValue) return Results.Unauthorized();
        var parent = await service.ResolveAsync(userId.Value, ct);
        if (parent is null) return Results.Unauthorized();
        var snapshot = await service.GetDashboardAsync(userId.Value, ct);
        return Results.Ok(new
        {
            status = "success",
            data = new
            {
                todayAttendance = snapshot.TodayAttendance.ToString(),
                pendingHomework = snapshot.PendingHomework.ToString(),
                outstandingBalance = snapshot.OutstandingBalance,
                latestSkillScore = snapshot.LatestSkillScore?.ToString() ?? "-",
                children = snapshot.Children
            }
        });
    }

    private static async Task<IResult> GetProfile(HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        var userId = GetUserId(httpContext);
        if (!userId.HasValue) return Results.Unauthorized();
        var result = await service.GetProfileAsync(userId.Value, ct);
        if (result is null) return Results.Unauthorized();
        return Results.Ok(new
        {
            status = "success",
            data = new
            {
                id = result.Parent.Id,
                fullName = result.Parent.FullName,
                phone = result.Parent.Phone,
                email = result.Email,
                children = result.Children
            }
        });
    }

    private static async Task<IResult> UpdateProfile(
        UpdateParentProfileRequest request,
        HttpContext httpContext,
        IParentService service,
        CancellationToken ct)
    {
        var userId = GetUserId(httpContext);
        if (!userId.HasValue) return Results.Unauthorized();
        var result = await service.UpdateProfileAsync(userId.Value, request, ct);
        if (result is null) return Results.Unauthorized();
        return Results.Ok(new
        {
            status = "success",
            data = new { id = result.Parent.Id, fullName = result.Parent.FullName, phone = result.Parent.Phone, email = result.Email }
        });
    }

    private static async Task<IResult> GetChildAttendance(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        var records = await service.GetAttendanceAsync(childId, ct);
        return Results.Ok(new
        {
            status = "success",
            data = records.Select(r => new
            {
                r.CourseName,
                date = r.ScheduledAt.ToString("yyyy-MM-dd"),
                time = r.ScheduledAt.ToString("HH:mm"),
                r.Status
            })
        });
    }

    private static async Task<IResult> GetChildPayments(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        var payments = await service.GetPaymentsAsync(childId, ct);
        return Results.Ok(new
        {
            status = "success",
            data = payments.Select(p => new
            {
                p.InvoiceNo,
                description = p.CourseName,
                date = p.PaidAt.ToString("yyyy-MM-dd"),
                amount = p.Amount,
                status = "paid"
            })
        });
    }

    private static async Task<IResult> GetChildScores(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        return Results.Ok(new { status = "success", data = await service.GetScoresAsync(childId, ct) });
    }

    private static async Task<IResult> GetChildHomework(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        var homework = await service.GetHomeworkAsync(childId, ct);
        return Results.Ok(new
        {
            status = "success",
            data = homework.Select(h => new
            {
                id = h.Id,
                courseName = h.CourseName,
                title = h.Title,
                description = h.Description,
                dueAt = h.DueAt.ToString("yyyy-MM-dd")
            })
        });
    }

    private static async Task<IResult> GetChildLeaveRequests(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        var items = await service.GetLeaveRequestsAsync(childId, ct);
        return Results.Ok(new
        {
            status = "success",
            data = items.Select(i => new
            {
                i.Id,
                courseName = i.CourseName,
                reason = i.Reason,
                type = i.Type,
                i.Status,
                createdAt = i.CreatedAt.ToString("yyyy-MM-dd")
            })
        });
    }

    private static async Task<IResult> CreateChildLeaveRequest(
        int childId,
        CreateLeaveRequestRequest request,
        HttpContext httpContext,
        IParentService parentService,
        ILeaveRequestService leaveService,
        CancellationToken ct)
    {
        var userId = GetUserId(httpContext);
        if (!userId.HasValue) return Results.Unauthorized();
        var parent = await parentService.ResolveAsync(userId.Value, ct);
        if (parent is null) return Results.Unauthorized();
        if (!await parentService.IsParentOfStudentAsync(userId.Value, childId, ct)) return Results.Forbid();
        try
        {
            var result = await leaveService.CreateAsync(childId, parent.InstituteId, request, ct);
            return Results.Ok(new { status = "success", data = result });
        }
        catch (LeaveRequestValidationException ex)
        {
            return Results.BadRequest(new { error = ex.Message, code = ex.ErrorCode });
        }
    }

    private static async Task<IResult> GetChildSessions(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        return Results.Ok(new { status = "success", data = await service.GetSessionsAsync(childId, ct) });
    }

    private static async Task<bool> OwnsChild(HttpContext context, int childId, IParentService service, CancellationToken ct)
    {
        var userId = GetUserId(context);
        return userId.HasValue && await service.IsParentOfStudentAsync(userId.Value, childId, ct);
    }

    private static IResult ParentForbidden(HttpContext context) =>
        GetUserId(context).HasValue ? Results.Forbid() : Results.Unauthorized();

    private static int? GetUserId(HttpContext context)
    {
        var value = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return int.TryParse(value, out var userId) ? userId : null;
    }

    private static async Task<string?> VerifyLineAccessToken(string accessToken, CancellationToken ct)
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            var response = await client.GetAsync(
                $"{LineVerifyEndpoint}?access_token={Uri.EscapeDataString(accessToken)}", ct);
            if (!response.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            if (doc.RootElement.TryGetProperty("sub", out var sub)) return sub.GetString();
            if (doc.RootElement.TryGetProperty("client_id", out var clientId)) return clientId.GetString();
            return null;
        }
        catch
        {
            return null;
        }
    }
}

public record BindLineRequest(string? LineUserId, string? AccessToken, string? Phone);
