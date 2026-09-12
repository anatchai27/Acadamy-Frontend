using academy_API.Services;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class FileUploadEndpoints
{
    public static IEndpointRouteBuilder MapFileUploadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uploads").WithTags("File Uploads").WithOpenApi().RequireAuthorization();

        group.MapPost("/logo", async (HttpContext context, IFormFile file, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadLogoAsync(instituteId, uploadedFile, ct)));
        group.MapPost("/payment-slip", async (HttpContext context, IFormFile file, int paymentId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadPaymentSlipAsync(instituteId, paymentId, uploadedFile, ct)));
        group.MapPost("/homework", async (HttpContext context, IFormFile file, int homeworkId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadHomeworkAsync(instituteId, homeworkId, uploadedFile, ct)));
        group.MapPost("/homework-submission", async (HttpContext context, IFormFile file, int submissionId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadHomeworkSubmissionAsync(instituteId, submissionId, uploadedFile, ct)));
        group.MapPost("/student-photo", async (HttpContext context, IFormFile file, int studentId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadStudentPhotoAsync(instituteId, studentId, uploadedFile, ct)));
        group.MapPost("/teacher-photo", async (HttpContext context, IFormFile file, int teacherId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadTeacherPhotoAsync(instituteId, teacherId, uploadedFile, ct)));

        return app;
    }

    private static async Task<IResult> Execute(HttpContext context, IFormFile file, Func<int, IFormFile, Task<DTOs.FileUploadResponse>> action)
    {
        var instituteId = context.GetInstituteId();
        if (!instituteId.HasValue) return Results.BadRequest(new { error = "User not associated with any institute." });
        try { return Results.Ok(await action(instituteId.Value, file)); }
        catch (FileUploadValidationException ex) when (ex.Code == "NOT_FOUND") { return Results.NotFound(new { error = ex.Message }); }
        catch (FileUploadValidationException ex) { return Results.BadRequest(new { error = ex.Message, code = ex.Code }); }
    }
}
