using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class PaymentServiceTests
{
    private static Mock<Repositories.IPaymentRepository> CreateMockRepo() => new();
    private static Mock<IBackgroundNotificationDispatcher> CreateMockDispatcher() => new();
    private static Mock<IReceiptPdfService> CreateMockReceipt() => new();
    private static Mock<Services.Interface.IFileStorageService> CreateMockStorage() => new();

    private static PaymentService CreateSut(
        Mock<Repositories.IPaymentRepository>? repoMock = null,
        Mock<IBackgroundNotificationDispatcher>? dispatcherMock = null,
        Mock<IReceiptPdfService>? receiptMock = null,
        Mock<Services.Interface.IFileStorageService>? storageMock = null) =>
        new(
            repoMock?.Object ?? CreateMockRepo().Object,
            dispatcherMock?.Object ?? CreateMockDispatcher().Object,
            receiptMock?.Object ?? CreateMockReceipt().Object,
            storageMock?.Object ?? CreateMockStorage().Object);

    private static Payment MakePayment(int id, string invoiceNo, string studentName, string courseName, decimal amount, string method)
    {
        return new Payment
        {
            Id = id,
            InvoiceNo = invoiceNo,
            Amount = amount,
            Method = method,
            SlipUrl = "https://slip.example.com/slip.png",
            PaidAt = new DateTime(2026, 6, 14, 14, 30, 0, DateTimeKind.Utc),
            CreatedAt = new DateTime(2026, 6, 14, 14, 30, 0, DateTimeKind.Utc),
            Enrollment = new Enrollment
            {
                Id = id,
                Student = new Student { FullName = studentName },
                Course = new Course { Name = courseName }
            }
        };
    }

    [Fact]
    public async Task CreateAsync_PaymentCreated_RendersAndUploadsReceipt()
    {
        // Arrange
        var repoMock = CreateMockRepo();
        var dispatcherMock = CreateMockDispatcher();
        var receiptMock = CreateMockReceipt();
        var storageMock = CreateMockStorage();
        var enrollment = new Enrollment
        {
            Id = 7,
            StudentId = 9,
            Student = new Student { Id = 9, FullName = "สมชาย" },
            Course = new Course { Name = "คณิตศาสตร์" }
        };
        var created = MakePayment(12, "INV-202609-0001", "สมชาย", "คณิตศาสตร์", 1200m, "cash");
        repoMock.Setup(x => x.GetEnrollmentWithStudentAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);
        repoMock.Setup(x => x.GenerateInvoiceNoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(created.InvoiceNo);
        repoMock.Setup(x => x.CreatePaymentWithTransactionAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>())).ReturnsAsync(created);
        repoMock.Setup(x => x.GetParentsWithLineByStudentIdAsync(9, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        receiptMock.Setup(x => x.Render(It.IsAny<ReceiptPdfData>())).Returns([1, 2, 3]);
        storageMock.Setup(x => x.UploadAsync(It.IsAny<Stream>(), "receipts/INV-202609-0001.pdf", "application/pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://storage.example/receipts/INV-202609-0001.pdf");
        var sut = CreateSut(repoMock, dispatcherMock, receiptMock, storageMock);

        // Act
        var result = await sut.CreateAsync(new CreatePaymentRequest(7, 1200m, "cash", null));

        // Assert
        Assert.Equal("https://storage.example/receipts/INV-202609-0001.pdf", result.Data.ReceiptPdfUrl);
        receiptMock.Verify(x => x.Render(It.Is<ReceiptPdfData>(data => data.InvoiceNo == created.InvoiceNo && data.Amount == 1200m)), Times.Once);
        storageMock.Verify(x => x.UploadAsync(It.IsAny<Stream>(), "receipts/INV-202609-0001.pdf", "application/pdf", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithLineParent_DispatchesLoggedPaymentNotification()
    {
        var repoMock = CreateMockRepo();
        var dispatcherMock = CreateMockDispatcher();
        var receiptMock = CreateMockReceipt();
        var storageMock = CreateMockStorage();
        BackgroundNotificationCandidate? candidate = null;
        var enrollment = new Enrollment
        {
            Id = 7,
            StudentId = 9,
            InstituteId = 4,
            Student = new Student { Id = 9, FullName = "สมชาย" },
            Course = new Course { Name = "คณิตศาสตร์" }
        };
        var created = MakePayment(12, "INV-202609-0001", "สมชาย", "คณิตศาสตร์", 1200m, "cash");
        repoMock.Setup(x => x.GetEnrollmentWithStudentAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);
        repoMock.Setup(x => x.GenerateInvoiceNoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(created.InvoiceNo);
        repoMock.Setup(x => x.CreatePaymentWithTransactionAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>())).ReturnsAsync(created);
        repoMock.Setup(x => x.GetParentsWithLineByStudentIdAsync(9, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Parent { Id = 22, UserId = 31, FullName = "ผู้ปกครอง", LineUserId = "line-user" }]);
        receiptMock.Setup(x => x.Render(It.IsAny<ReceiptPdfData>())).Returns([1, 2, 3]);
        storageMock.Setup(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), "application/pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://storage.example/receipt.pdf");
        dispatcherMock
            .Setup(d => d.DispatchAsync(It.IsAny<BackgroundNotificationCandidate>(), It.IsAny<CancellationToken>()))
            .Callback<BackgroundNotificationCandidate, CancellationToken>((value, _) => candidate = value)
            .ReturnsAsync(new BackgroundNotificationResult(true, false, 1, 10));

        var sut = CreateSut(repoMock, dispatcherMock, receiptMock, storageMock);
        await sut.CreateAsync(new CreatePaymentRequest(7, 1200m, "cash", null));

        Assert.NotNull(candidate);
        Assert.Equal("payment_received", candidate!.NotificationType);
        Assert.Equal("payment_received:12:22", candidate.IdempotencyKey);
        Assert.Equal(4, candidate.InstituteId);
        Assert.Contains("INV-202609-0001", candidate.Message);
    }

    // ──────────────────── GetHistoryAsync ────────────────────

    // 1
    [Fact]
    public async Task GetHistoryAsync_NoFilters_ReturnsAllPayments()
    {
        var payments = new List<Payment>
        {
            MakePayment(1, "INV-202606-0001", "สมชาย", "คณิตศาสตร์", 4500m, "transfer"),
            MakePayment(2, "INV-202606-0002", "สมหญิง", "ภาษาอังกฤษ", 3500m, "credit_card"),
        };

        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payments);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(8000m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 20);

        Assert.Equal("success", result.Status);
        Assert.Equal(2, result.Data.Payments.Count);
        Assert.Equal(8000m, result.Data.Summary.TotalAmountInRange);
        Assert.Equal(1, result.Data.Pagination.CurrentPage);
        Assert.Equal(1, result.Data.Pagination.TotalPages);
    }

    // 2
    [Fact]
    public async Task GetHistoryAsync_MapsPaymentFieldsCorrectly()
    {
        var payment = MakePayment(890, "INV-202606-0001", "ด.ช. สมชาย รักเรียน", "คณิตศาสตร์ ม.1 (เทอม 1)", 4500m, "transfer");

        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([payment]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(4500m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 20);

        var item = result.Data.Payments[0];
        Assert.Equal(890, item.Id);
        Assert.Equal("INV-202606-0001", item.InvoiceNo);
        Assert.Equal("ด.ช. สมชาย รักเรียน", item.StudentName);
        Assert.Equal("คณิตศาสตร์ ม.1 (เทอม 1)", item.CourseName);
        Assert.Equal(4500m, item.Amount);
        Assert.Equal("transfer", item.Method);
        Assert.Equal(payment.PaidAt, item.PaidAt);
        Assert.Equal("https://slip.example.com/slip.png", item.SlipUrl);
        Assert.Equal("https://storage.tiwhub.com/receipts/INV-202606-0001.pdf", item.ReceiptPdfUrl);
    }

    // 3
    [Fact]
    public async Task GetHistoryAsync_EmptyResult_ReturnsEmptyListAndZeroTotal()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 20);

        Assert.Empty(result.Data.Payments);
        Assert.Equal(0m, result.Data.Summary.TotalAmountInRange);
        Assert.Equal(1, result.Data.Pagination.TotalPages);
    }

    // 4
    [Fact]
    public async Task GetHistoryAsync_WithDateFilter_PassesDatesToRepo()
    {
        var startDate = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = new DateTime(2026, 6, 30, 23, 59, 59, DateTimeKind.Utc);

        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(startDate, endDate, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repoMock.Setup(r => r.GetTotalAmountAsync(startDate, endDate, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0m);
        repoMock.Setup(r => r.GetPaymentCountAsync(startDate, endDate, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var sut = CreateSut(repoMock);
        await sut.GetHistoryAsync(startDate, endDate, null, 1, 20);

        repoMock.Verify(r => r.GetPaymentsAsync(startDate, endDate, null, 1, 20, It.IsAny<CancellationToken>()), Times.Once);
        repoMock.Verify(r => r.GetTotalAmountAsync(startDate, endDate, null, It.IsAny<CancellationToken>()), Times.Once);
        repoMock.Verify(r => r.GetPaymentCountAsync(startDate, endDate, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 5
    [Fact]
    public async Task GetHistoryAsync_WithMethodFilter_PassesMethodToRepo()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, "transfer", 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, "transfer", It.IsAny<CancellationToken>()))
            .ReturnsAsync(0m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, "transfer", It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var sut = CreateSut(repoMock);
        await sut.GetHistoryAsync(null, null, "transfer", 1, 20);

        repoMock.Verify(r => r.GetPaymentsAsync(null, null, "transfer", 1, 20, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 6
    [Fact]
    public async Task GetHistoryAsync_WithPagination_PassesPageAndLimit()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 3, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var sut = CreateSut(repoMock);
        await sut.GetHistoryAsync(null, null, null, 3, 10);

        repoMock.Verify(r => r.GetPaymentsAsync(null, null, null, 3, 10, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 7
    [Fact]
    public async Task GetHistoryAsync_MultiplePages_CalculatesTotalPagesCorrectly()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync([MakePayment(1, "INV-001", "สมชาย", "คณิต", 1000m, "cash")]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1000m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(25);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 10);

        Assert.Equal(3, result.Data.Pagination.TotalPages);
    }

    // 8
    [Fact]
    public async Task GetHistoryAsync_TotalCountDivisibleByLimit_CalculatesExactPages()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(60);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 20);

        Assert.Equal(3, result.Data.Pagination.TotalPages);
    }

    // 9
    [Fact]
    public async Task GetHistoryAsync_SummaryReflectsFilteredTotal()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                MakePayment(1, "INV-001", "สมชาย", "คณิต", 1500.50m, "cash"),
                MakePayment(2, "INV-002", "สมหญิง", "อังกฤษ", 2750.75m, "transfer"),
            ]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(4251.25m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 20);

        Assert.Equal(4251.25m, result.Data.Summary.TotalAmountInRange);
    }

    // 10
    [Fact]
    public async Task GetHistoryAsync_NullEnrollment_NullStudentAndCourseNames()
    {
        var payment = new Payment
        {
            Id = 1,
            InvoiceNo = "INV-001",
            Amount = 1000m,
            Method = "cash",
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Enrollment = null!
        };

        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetPaymentsAsync(null, null, null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([payment]);
        repoMock.Setup(r => r.GetTotalAmountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1000m);
        repoMock.Setup(r => r.GetPaymentCountAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut(repoMock);
        var result = await sut.GetHistoryAsync(null, null, null, 1, 20);

        var item = result.Data.Payments[0];
        Assert.Null(item.StudentName);
        Assert.Null(item.CourseName);
    }
}
