using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using academy_API.Services.Contracts;
using academy_API.Services.Interface;

namespace academy_API.Controllers;

public static class ParentEndpoints
{
    private const string LineIdTokenVerifyEndpoint = "https://api.line.me/oauth2/v2.1/verify";
    private static readonly HttpClient LineHttpClient = new() { Timeout = TimeSpan.FromSeconds(10) };

    public static IEndpointRouteBuilder MapParentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/parents").WithTags("Parents").WithOpenApi();
        group.MapPost("/bind-line", BindLine).AllowAnonymous();
        group.MapGet("/me/dashboard", GetDashboard).RequireAuthorization();
        group.MapGet("/me/profile", GetProfile).RequireAuthorization();
        group.MapPatch("/me/profile", UpdateProfile).RequireAuthorization();
        group.MapGet("/children/{childId:int}/attendance", GetChildAttendance).RequireAuthorization();
        group.MapGet("/children/{childId:int}/payments", GetChildPayments).RequireAuthorization();
        group.MapGet("/children/{childId:int}/payable-balances", GetChildPayableBalances).RequireAuthorization();
        group.MapPost("/children/{childId:int}/payment-batches", CreateChildPaymentBatch).RequireAuthorization();
        group.MapGet("/children/{childId:int}/scores", GetChildScores).RequireAuthorization();
        group.MapGet("/children/{childId:int}/homework", GetChildHomework).RequireAuthorization();
        group.MapGet("/children/{childId:int}/progress", GetChildProgress).RequireAuthorization();
        group.MapPost("/children/{childId:int}/homework/{homeworkId:int}/submission", CreateChildHomeworkSubmission).RequireAuthorization();
        group.MapGet("/children/{childId:int}/leave-requests", GetChildLeaveRequests).RequireAuthorization();
        group.MapGet("/children/{childId:int}/sessions", GetChildSessions).RequireAuthorization();
        group.MapPost("/children/{childId:int}/leave-requests", CreateChildLeaveRequest).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> BindLine(
        BindLineRequest request,
        IParentService service,
        ITokenService tokenService,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
            return Results.BadRequest(new { error = "idToken is required." });

        var channelId = configuration["Line:LoginChannelId"];
        if (string.IsNullOrWhiteSpace(channelId))
            return Results.Problem("LINE login channel ID is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);

        var verifiedUserId = await GetVerifiedLineUserId(request.IdToken, channelId, ct);
        if (string.IsNullOrWhiteSpace(verifiedUserId))
            return Results.Unauthorized();

        var allowTestPhoneBinding = environment.IsDevelopment() &&
            configuration.GetValue<bool>("MODE_TEST_AUTH");
        var outcome = await service.BindLineAsync(verifiedUserId, request.Phone, allowTestPhoneBinding, ct);
        if (outcome.Status == ParentBindingStatus.NotFound)
            return Results.Json(new { code = "PARENT_NOT_FOUND", error = "ไม่พบข้อมูลผู้ปกครอง กรุณาติดต่อโรงเรียน" }, statusCode: 404);
        if (outcome.Status == ParentBindingStatus.VerificationRequired)
            return Results.Json(new { code = "PHONE_VERIFICATION_REQUIRED", error = "กรุณายืนยันความเป็นเจ้าของเบอร์โทรกับโรงเรียนก่อนเชื่อมต่อ LINE" }, statusCode: 409);
        if (outcome.Status is ParentBindingStatus.Ambiguous or ParentBindingStatus.Conflict)
            return Results.Json(new { code = "PARENT_BINDING_REQUIRES_REVIEW", error = "ไม่สามารถยืนยันบัญชีจากข้อมูลนี้ได้ กรุณาติดต่อโรงเรียนเพื่อตรวจสอบ" }, statusCode: 409);

        var result = outcome.Binding!;

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
                courseNameEn = r.CourseNameEn,
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
                p.Id,
                batchId = p.BatchId,
                p.InvoiceNo,
                description = p.CourseName,
                descriptionEn = p.CourseNameEn,
                date = p.PaidAt.ToString("yyyy-MM-dd"),
                amount = p.Amount,
                method = "",
                status = p.Status == PaymentStatus.Succeeded ? "paid" : p.Status,
                slipUrl = p.SlipUrl,
                receiptPdfUrl = p.ReceiptPdfUrl,
                p.InstituteName,
                p.InstituteContactPhone,
                p.BankName,
                p.BankAccountName,
                p.BankAccountNumber,
                p.PromptPayId,
                p.PaymentInstructions,
                p.PaymentQrImageUrl
            })
        });
    }

    private static async Task<IResult> GetChildPayableBalances(
        int childId,
        HttpContext httpContext,
        IParentService service,
        CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        var balances = await service.GetPayableBalancesAsync(childId, ct);
        return Results.Ok(new
        {
            status = "success",
            data = balances.Select(balance => new
            {
                balance.EnrollmentId,
                balance.StudentId,
                balance.StudentName,
                balance.CourseName,
                balance.AmountDue,
                balance.InstituteName,
                balance.InstituteContactPhone,
                balance.BankName,
                balance.BankAccountName,
                balance.BankAccountNumber,
                balance.PromptPayId,
                balance.PaymentInstructions,
                balance.PaymentQrImageUrl
            })
        });
    }

    private static async Task<IResult> CreateChildPaymentBatch(
        int childId,
        CreateParentPaymentBatchRequest request,
        HttpContext httpContext,
        IParentService parentService,
        IPaymentBatchService paymentBatchService,
        CancellationToken ct)
    {
        var userId = GetUserId(httpContext);
        if (!userId.HasValue) return Results.Unauthorized();
        if (!await parentService.IsParentOfStudentAsync(userId.Value, childId, ct)) return Results.Forbid();
        if (request.EnrollmentId <= 0)
            return Results.BadRequest(new { error = "เลือกรายการคอร์สที่ต้องการชำระ", code = "INVALID_ENROLLMENT" });

        try
        {
            return Results.Ok(await paymentBatchService.CreateParentTransferAsync(
                userId.Value, childId, request.EnrollmentId, ct));
        }
        catch (PaymentValidationException ex) when (ex.ErrorCode == "BALANCE_ALREADY_RESERVED")
        {
            return Results.Conflict(new { error = ex.Message, code = ex.ErrorCode });
        }
        catch (PaymentValidationException ex) when (ex.ErrorCode == "ENROLLMENT_NOT_FOUND")
        {
            return Results.NotFound(new { error = ex.Message, code = ex.ErrorCode });
        }
        catch (PaymentValidationException ex)
        {
            return Results.BadRequest(new { error = ex.Message, code = ex.ErrorCode });
        }
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
                courseNameEn = h.CourseNameEn,
                title = h.Title,
                titleEn = h.TitleEn,
                description = h.Description,
                descriptionEn = h.DescriptionEn,
                dueAt = h.DueAt.ToString("yyyy-MM-dd"),
                submissionId = h.SubmissionId,
                submittedAt = h.SubmittedAt,
                score = h.Score,
                feedback = h.Feedback
            })
        });
    }

    private static async Task<IResult> GetChildProgress(int childId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        if (!await OwnsChild(httpContext, childId, service, ct)) return ParentForbidden(httpContext);
        return Results.Ok(new { status = "success", data = await service.GetProgressAsync(childId, ct) });
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
                courseNameEn = i.CourseNameEn,
                reason = i.Reason,
                type = i.Type,
                i.Status,
                createdAt = i.CreatedAt.ToString("yyyy-MM-dd")
            })
        });
    }

    private static async Task<IResult> CreateChildHomeworkSubmission(int childId, int homeworkId, HttpContext httpContext, IParentService service, CancellationToken ct)
    {
        var userId = GetUserId(httpContext);
        if (!userId.HasValue) return Results.Unauthorized();
        var submission = await service.CreateOrGetHomeworkSubmissionAsync(userId.Value, childId, homeworkId, ct);
        return submission is null
            ? ParentForbidden(httpContext)
            : Results.Ok(new { status = "success", data = new { submissionId = submission.Id, fileUrl = submission.FileUrl, submittedAt = submission.SubmittedAt } });
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

    private static async Task<string?> GetVerifiedLineUserId(string idToken, string channelId, CancellationToken ct)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, LineIdTokenVerifyEndpoint)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["id_token"] = idToken,
                    ["client_id"] = channelId
                })
            };
            using var response = await LineHttpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            return doc.RootElement.TryGetProperty("sub", out var subject) ? subject.GetString() : null;
        }
        catch (HttpRequestException)
        {
            return null;
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}

public record BindLineRequest(string? IdToken, string? Phone);
public record CreateParentPaymentBatchRequest(int EnrollmentId);
