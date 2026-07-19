using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services.Contracts;

namespace academy_API.Services;

public class StudentService(IStudentRepository studentRepository) : IStudentService
{
    private readonly IStudentRepository _studentRepository = studentRepository;

    public async Task<StudentListResponse> GetAllAsync(string? search, int page, int limit, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var (items, totalCount) = await _studentRepository.SearchAsync(search, page, limit, ct);

        var totalPages = (int)Math.Ceiling((double)totalCount / limit);

        return new StudentListResponse(
            "success",
            new StudentListData(
                items,
                new PaginationInfo(
                    page,
                    totalPages,
                    totalCount,
                    page < totalPages
                )
            )
        );
    }

    public async Task<StudentProfileResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdWithParentsAsync(id, ct);
        return student is null ? null : MapToProfileResponse(student);
    }

    public async Task<UpdateStudentResponse> UpdateAsync(int id, UpdateStudentRequest request, CancellationToken ct = default)
    {
        try
        {
            var student = await _studentRepository.UpdateAsync(id, request, ct);

            if (student is null)
                throw new StudentValidationException("NOT_FOUND", "ไม่พบข้อมูลนักเรียน");

            return new UpdateStudentResponse("success", "อัปเดตข้อมูลสำเร็จ");
        }
        catch (InvalidOperationException ex) when (ex.Message == "FORBIDDEN")
        {
            throw new StudentValidationException("FORBIDDEN", "Access denied: student belongs to a different institute.");
        }
    }

    public async Task<QrTokenResponse> GetQrTokenAsync(int id, CancellationToken ct = default)
    {
        var student = await _studentRepository.RotateQrTokenAsync(id, ct);

        if (student is null)
            throw new StudentValidationException("NOT_FOUND", "ไม่พบข้อมูลนักเรียน");

        return new QrTokenResponse(
            "success",
            new QrTokenData(
                student.Id,
                student.QrToken!,
                DateTime.UtcNow.AddSeconds(60),
                60
            )
        );
    }

    public async Task<CreateStudentResponse> CreateAsync(
        CreateStudentRequest request,
        int instituteId,
        string? ipAddress,
        CancellationToken ct = default)
    {
        ValidateRequest(request);

        var student = BuildStudent(request, instituteId);
        var parents = BuildParents(request);
        var pdpa = BuildPdpaConsent(request, ipAddress);

        var created = await _studentRepository.CreateWithTransactionAsync(student, parents, pdpa, ct);

        return new CreateStudentResponse(
            "success",
            "บันทึกข้อมูลนักเรียนสำเร็จ",
            new CreateStudentData(
                created.Id,
                created.QrToken ?? string.Empty,
                DateTime.UtcNow
            )
        );
    }

    private static Student BuildStudent(CreateStudentRequest request, int instituteId)
    {
        return new Student
        {
            InstituteId = instituteId,
            FullName = request.Student.FullName.Trim(),
            Nickname = request.Student.Nickname?.Trim(),
            Grade = request.Student.Grade?.Trim(),
            School = request.Student.School?.Trim(),
            PhotoUrl = request.Student.PhotoUrl?.Trim(),
            MedicalInfo = request.Student.MedicalInfo?.Trim(),
            QrToken = Guid.NewGuid().ToString("N"),
            CreatedAt = DateTime.UtcNow
        };
    }

    private static List<Parent> BuildParents(CreateStudentRequest request)
    {
        return request.Parents.Select(p => new Parent
        {
            FullName = p.FullName.Trim(),
            Phone = p.Phone?.Trim(),
            Relationship = p.Relationship?.Trim()
        }).ToList();
    }

    private static PdpaConsent BuildPdpaConsent(CreateStudentRequest request, string? ipAddress)
    {
        return new PdpaConsent
        {
            ConsentVersion = string.IsNullOrWhiteSpace(request.Pdpa.ConsentVersion)
                ? "1.0"
                : request.Pdpa.ConsentVersion,
            IsAccepted = request.Pdpa.IsAccepted,
            IpAddress = ipAddress,
            AcceptedAt = DateTime.UtcNow
        };
    }

    private static void ValidateRequest(CreateStudentRequest request)
    {
        var errors = new List<string>();

        if (request?.Student == null || string.IsNullOrWhiteSpace(request.Student.FullName))
            errors.Add("กรุณาระบุชื่อ-นามสกุลนักเรียน");

        if (request?.Parents == null || request.Parents.Count == 0)
            errors.Add("กรุณาระบุข้อมูลผู้ปกครองอย่างน้อย 1 ท่าน");
        else
        {
            foreach (var parent in request.Parents)
            {
                if (string.IsNullOrWhiteSpace(parent.FullName))
                {
                    errors.Add("กรุณาระบุชื่อ-นามสกุลผู้ปกครอง");
                    break;
                }

                if (!string.IsNullOrWhiteSpace(parent.Phone))
                {
                    var digits = new string(parent.Phone.Where(char.IsDigit).ToArray());
                    if (digits.Length != 10)
                    {
                        errors.Add("กรุณาระบุเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน (10 หลัก)");
                        break;
                    }
                }
            }
        }

        if (errors.Count > 0)
            throw new StudentValidationException("VALIDATION_FAILED", string.Join("; ", errors));
    }

    private static StudentProfileResponse MapToProfileResponse(Student s) => new(
        "success",
        new StudentProfileData(
            s.Id,
            s.FullName,
            s.Nickname,
            s.Grade,
            s.School,
            s.MedicalInfo,
            s.PhotoUrl,
            s.CreatedAt,
            s.Parents
                .OrderBy(p => p.Id)
                .Select(p => new ParentProfileInfo(
                    p.Id,
                    p.FullName,
                    p.Phone,
                    p.Relationship,
                    p.LineUserId
                ))
                .ToList()
        )
    );

    private static StudentResponse MapToStudentResponse(Student s) => new(
        s.Id,
        s.UserId,
        s.FullName,
        s.Nickname,
        s.Grade,
        s.School,
        s.QrToken,
        s.PhotoUrl,
        s.MedicalInfo,
        s.CreatedAt
    );
}

public class StudentValidationException : Exception
{
    public string ErrorCode { get; }

    public StudentValidationException(string errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }
}