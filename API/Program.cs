using System.Text;
using academy_API.Data;
using academy_API.Middlewares;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Contracts;
using academy_API.Controllers;
using academy_API.Utilities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// Register application services
builder.Services.AddSingleton<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPdpaConsentRepository, PdpaConsentRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<IDbConnectionValidator, DbConnectionValidator>();

builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();
builder.Services.AddScoped<ILeaveRequestService, LeaveRequestService>();
builder.Services.AddScoped<IHomeworkRepository, HomeworkRepository>();
builder.Services.AddScoped<IHomeworkService, HomeworkService>();
builder.Services.AddScoped<ISkillScoreRepository, SkillScoreRepository>();
builder.Services.AddScoped<ISkillScoreService, SkillScoreService>();

builder.Services.AddHttpClient<ILineNotificationService, LineNotificationService>(client =>
{
    client.BaseAddress = new Uri("https://api.line.me/");
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {builder.Configuration["Line:ChannelAccessToken"]}");
});

// Register TutoringDbContext with TiDB Cloud connection
var connectionString = builder.Configuration.GetConnectionString("TutoringDbConnection")
    ?? throw new InvalidOperationException("Connection string 'TutoringDbConnection' not found.");

builder.Services.AddDbContext<TutoringDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            mysqlOptions.CommandTimeout(30);
        }));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowFrontend");

// Register custom middlewares
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Enable authentication and authorization middleware
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();

// Map endpoint groups
app.MapProductEndpoints();
app.MapStudentEndpoints();
app.MapTeacherEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAttendanceEndpoints();
app.MapCourseEndpoints();
app.MapSessionEndpoints();
app.MapEnrollmentEndpoints();
app.MapPaymentEndpoints();
app.MapLeaveRequestEndpoints();
app.MapHomeworkEndpoints();
app.MapSkillScoreEndpoints();

// Database connection test endpoint
app.MapGet("/api/v1/test-connection", (IDbConnectionValidator validator) =>
{
    var result = validator.ValidateConnection();
    
    if (result.IsSuccess)
    {
        return Results.Ok(new { 
            Success = true, 
            Message = result.Message 
        });
    }
    
    return Results.BadRequest(new { 
        Success = false, 
        Message = result.Message 
    });
})
.WithName("TestConnection")
.WithOpenApi();

// Health check endpoint
app.MapGet("/api/health", async (TutoringDbContext db, CancellationToken ct) =>
{
    try
    {
        await db.Database.CanConnectAsync(ct);
        return Results.Ok(new { Status = "Healthy", Database = "TiDB Cloud" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Database connection failed: {ex.Message}", statusCode: 503);
    }
})
.WithName("HealthCheck")
.WithOpenApi();

app.Run();
