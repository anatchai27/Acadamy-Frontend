using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class StudentServiceTests
{
    private static Mock<academy_API.Repositories.IStudentRepository> CreateMockRepo() => new();

    private static CreateStudentRequest CreateValidRequest(
        string fullName = "ด.ช. สมชาย รักเรียน",
        string parentName = "นาง สมศรี",
        string? parentPhone = "0812345678",
        bool pdpaAccepted = true) => new(
        new StudentInfo(fullName, "น้องชาย", "ม.1", "รร.ตัวอย่าง", null, null),
        [new ParentInfo(parentName, parentPhone, "มารดา")],
        new PdpaInfo(pdpaAccepted, "1.0")
    );

    // 1 ──────────────────── CreateAsync ────────────────────

    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsCreateStudentResponse()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateWithTransactionAsync(It.IsAny<Student>(), It.IsAny<List<Parent>>(), It.IsAny<PdpaConsent>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student s, List<Parent> _, PdpaConsent _, CancellationToken _) =>
            {
                s.Id = 105; s.QrToken = "qr-abc123"; return s;
            });

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.CreateAsync(CreateValidRequest(), null, "127.0.0.1");

        Assert.Equal("success", result.Status);
        Assert.Equal(105, result.Data.StudentId);
        Assert.Equal("qr-abc123", result.Data.QrToken);
    }

    // 2
    [Fact]
    public async Task CreateAsync_EmptyFullName_ThrowsValidationException()
    {
        var sut = new StudentService(CreateMockRepo().Object);
        var request = CreateValidRequest(fullName: "");

        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.CreateAsync(request, null, "127.0.0.1"));
        Assert.Equal("VALIDATION_FAILED", ex.ErrorCode);
    }

    // 3
    [Fact]
    public async Task CreateAsync_WhitespaceFullName_ThrowsValidationException()
    {
        var sut = new StudentService(CreateMockRepo().Object);
        var request = CreateValidRequest(fullName: "   ");

        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.CreateAsync(request, null, "127.0.0.1"));
        Assert.Equal("VALIDATION_FAILED", ex.ErrorCode);
    }

    // 4
    [Fact]
    public async Task CreateAsync_NoParents_ThrowsValidationException()
    {
        var sut = new StudentService(CreateMockRepo().Object);
        var request = new CreateStudentRequest(
            new StudentInfo("สมชาย", null, null, null, null, null),
            [],
            new PdpaInfo(true, "1.0"));

        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.CreateAsync(request, null, "127.0.0.1"));
        Assert.Contains("ผู้ปกครอง", ex.Message);
    }

    // 5
    [Fact]
    public async Task CreateAsync_ParentEmptyName_ThrowsValidationException()
    {
        var sut = new StudentService(CreateMockRepo().Object);
        var request = CreateValidRequest(parentName: "");

        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.CreateAsync(request, null, "127.0.0.1"));
        Assert.Equal("VALIDATION_FAILED", ex.ErrorCode);
    }

    // 6
    [Fact]
    public async Task CreateAsync_ParentPhoneNot10Digits_ThrowsValidationException()
    {
        var sut = new StudentService(CreateMockRepo().Object);
        var request = CreateValidRequest(parentPhone: "08123");

        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.CreateAsync(request, null, "127.0.0.1"));
        Assert.Contains("10 หลัก", ex.Message);
    }

    // 7
    [Fact]
    public async Task CreateAsync_ParentPhone10Digits_PassesValidation()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateWithTransactionAsync(It.IsAny<Student>(), It.IsAny<List<Parent>>(), It.IsAny<PdpaConsent>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student s, List<Parent> _, PdpaConsent _, CancellationToken _) => { s.Id = 1; return s; });

        var sut = new StudentService(mockRepo.Object);
        var request = CreateValidRequest(parentPhone: "0891234567");
        var result = await sut.CreateAsync(request, null, "127.0.0.1");
        Assert.Equal("success", result.Status);
    }

    // 8
    [Fact]
    public async Task CreateAsync_TrimsStudentFields()
    {
        Student? captured = null;
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateWithTransactionAsync(It.IsAny<Student>(), It.IsAny<List<Parent>>(), It.IsAny<PdpaConsent>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student s, List<Parent> _, PdpaConsent _, CancellationToken _) => { captured = s; s.Id = 1; return s; });

        var sut = new StudentService(mockRepo.Object);
        var request = CreateValidRequest(fullName: "  สมชาย  ");

        await sut.CreateAsync(request, null, "127.0.0.1");
        Assert.Equal("สมชาย", captured!.FullName);
    }

    // 9
    [Fact]
    public async Task CreateAsync_GeneratesQrToken()
    {
        Student? captured = null;
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateWithTransactionAsync(It.IsAny<Student>(), It.IsAny<List<Parent>>(), It.IsAny<PdpaConsent>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student s, List<Parent> _, PdpaConsent _, CancellationToken _) => { captured = s; s.Id = 1; return s; });

        var sut = new StudentService(mockRepo.Object);
        await sut.CreateAsync(CreateValidRequest(), null, "127.0.0.1");

        Assert.NotNull(captured!.QrToken);
        Assert.NotEmpty(captured.QrToken);
    }

    // 10
    [Fact]
    public async Task CreateAsync_PdpaConsentVersionDefaultsTo1_0()
    {
        PdpaConsent? captured = null;
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateWithTransactionAsync(It.IsAny<Student>(), It.IsAny<List<Parent>>(), It.IsAny<PdpaConsent>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student s, List<Parent> _, PdpaConsent p, CancellationToken _) => { captured = p; s.Id = 1; return s; });

        var sut = new StudentService(mockRepo.Object);
        var request = CreateValidRequest(pdpaAccepted: true);
        request = request with { Pdpa = new PdpaInfo(true, null) };

        await sut.CreateAsync(request, null, "127.0.0.1");
        Assert.Equal("1.0", captured!.ConsentVersion);
    }

    // 11 ──────────────────── GetByIdAsync ────────────────────

    [Fact]
    public async Task GetByIdAsync_ExistingStudent_ReturnsProfileResponse()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.GetByIdWithParentsAsync(105, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student
            {
                Id = 105,
                FullName = "สมชาย",
                Nickname = "ชาย",
                Grade = "ม.1",
                School = "รร.ตัวอย่าง",
                MedicalInfo = "แพ้อาหาร",
                PhotoUrl = "url",
                CreatedAt = new DateTime(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc),
                Parents = [new Parent { Id = 1, FullName = "แม่", Phone = "0812345678", Relationship = "มารดา" }]
            });

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.GetByIdAsync(105, null);

        Assert.NotNull(result);
        Assert.Equal("success", result!.Status);
        Assert.Equal(105, result.Data.Id);
        Assert.Equal("สมชาย", result.Data.FullName);
        Assert.Single(result.Data.Parents);
    }

    // 12
    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.GetByIdWithParentsAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.GetByIdAsync(999, null);
        Assert.Null(result);
    }

    // 13 ──────────────────── GetAllAsync ────────────────────

    [Fact]
    public async Task GetAllAsync_ReturnsPaginatedResponse()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.SearchAsync(null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<StudentListItem>(), 0));

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.GetAllAsync(null, null, 1, 20);

        Assert.Equal("success", result.Status);
        Assert.Equal(1, result.Data.Pagination.CurrentPage);
    }

    // 14
    [Fact]
    public async Task GetAllAsync_NegativePage_ClampsToOne()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.SearchAsync(null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<StudentListItem>(), 0));

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.GetAllAsync(null, null, -5, 20);

        Assert.Equal(1, result.Data.Pagination.CurrentPage);
    }

    // 15
    [Fact]
    public async Task GetAllAsync_CalculatesHasNextCorrectly()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.SearchAsync(null, null, 1, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<StudentListItem>(), 12));

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.GetAllAsync(null, null, 1, 5);

        Assert.Equal(3, result.Data.Pagination.TotalPages);
        Assert.True(result.Data.Pagination.HasNext);
    }

    // 16 ──────────────────── UpdateAsync ────────────────────

    [Fact]
    public async Task UpdateAsync_ExistingStudent_ReturnsSuccess()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.UpdateAsync(105, null, It.IsAny<UpdateStudentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 105 });

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.UpdateAsync(105, null, new UpdateStudentRequest(
            new StudentUpdate("ใหม่", null, null, null, null, null), null));

        Assert.Equal("success", result.Status);
        Assert.Equal("อัปเดตข้อมูลสำเร็จ", result.Message);
    }

    // 17
    [Fact]
    public async Task UpdateAsync_NotFound_ThrowsNotFoundException()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.UpdateAsync(999, null, It.IsAny<UpdateStudentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);

        var sut = new StudentService(mockRepo.Object);
        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.UpdateAsync(999, null, new UpdateStudentRequest(null, null)));
        Assert.Equal("NOT_FOUND", ex.ErrorCode);
    }

    // 18 ──────────────────── GetQrTokenAsync ────────────────────

    [Fact]
    public async Task GetQrTokenAsync_ExistingStudent_RotatesAndReturnsToken()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.RotateQrTokenAsync(105, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student
            {
                Id = 105,
                QrToken = "tiwhub_105_abc123_1718366280",
                CreatedAt = DateTime.UtcNow
            });

        var sut = new StudentService(mockRepo.Object);
        var result = await sut.GetQrTokenAsync(105, null);

        Assert.Equal("success", result.Status);
        Assert.Equal(105, result.Data.StudentId);
        Assert.StartsWith("tiwhub_", result.Data.QrToken);
        Assert.Equal(60, result.Data.RefreshIntervalSec);
    }

    // 19
    [Fact]
    public async Task GetQrTokenAsync_NotFound_ThrowsNotFoundException()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.RotateQrTokenAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);

        var sut = new StudentService(mockRepo.Object);
        var ex = await Assert.ThrowsAsync<StudentValidationException>(
            () => sut.GetQrTokenAsync(999, null));
        Assert.Equal("NOT_FOUND", ex.ErrorCode);
    }
}
