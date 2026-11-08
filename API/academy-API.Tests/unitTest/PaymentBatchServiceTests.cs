using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Repositories.Interface;
using academy_API.Services;
using academy_API.Services.Interface;
using Moq;

namespace academy_API.Tests.unitTest;

public class PaymentBatchServiceTests
{
    private static Enrollment Enrollment(int id, int studentId, decimal price) => new()
    {
        Id = id,
        StudentId = studentId,
        InstituteId = 4,
        Student = new Student { Id = studentId, FullName = $"Student {studentId}" },
        Course = new Course { Name = $"Course {id}", Price = price }
    };

    private static PaymentBatchService CreateSut(
        Mock<IPaymentBatchRepository> batchRepository,
        Mock<IPaymentRepository>? paymentRepository = null,
        Mock<IPaymentBatchReceiptService>? receiptService = null,
        Mock<ISlipVerificationProvider>? verificationProvider = null,
        Mock<IOmisePromptPayGateway>? omiseGateway = null) => new(
            batchRepository.Object,
            paymentRepository?.Object ?? Mock.Of<IPaymentRepository>(),
            receiptService?.Object ?? Mock.Of<IPaymentBatchReceiptService>(),
            verificationProvider?.Object ?? Mock.Of<ISlipVerificationProvider>(),
            omiseGateway?.Object);

    private static void SetupBalances(Mock<IPaymentRepository> payments, Mock<IPaymentBatchRepository> batches)
    {
        payments.Setup(repository => repository.GetSucceededAmountByEnrollmentAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(0m);
        payments.Setup(repository => repository.GetPendingAmountByEnrollmentAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(0m);
        batches.Setup(repository => repository.GetSucceededAmountByEnrollmentAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(0m);
        batches.Setup(repository => repository.GetPendingAmountByEnrollmentAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(0m);
    }

    [Fact]
    public async Task CreateAsync_CashBatch_CombinesMultipleStudentsAndCourses()
    {
        var batches = new Mock<IPaymentBatchRepository>();
        var payments = new Mock<IPaymentRepository>();
        var receipts = new Mock<IPaymentBatchReceiptService>();
        SetupBalances(payments, batches);
        batches.Setup(repository => repository.GetEnrollmentAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(Enrollment(10, 1, 1000m));
        batches.Setup(repository => repository.GetEnrollmentAsync(11, It.IsAny<CancellationToken>())).ReturnsAsync(Enrollment(11, 2, 2000m));
        batches.Setup(repository => repository.GenerateInvoiceNoAsync(It.IsAny<CancellationToken>())).ReturnsAsync("INV-202610-B123456789");
        batches.Setup(repository => repository.CreateAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentBatch batch, CancellationToken _) => batch);
        receipts.Setup(service => service.IssueAndNotifyAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://receipts.test/batch.pdf");

        var result = await CreateSut(batches, payments, receipts).CreateAsync(new CreatePaymentBatchRequest(
            [new PaymentBatchAllocationRequest(10, 800m), new PaymentBatchAllocationRequest(11, 1500m)],
            "cash"));

        Assert.Equal(2300m, result.Data.Amount);
        Assert.Equal("succeeded", result.Data.Status);
        Assert.Equal(2, result.Data.Allocations.Count);
        Assert.Equal("https://receipts.test/batch.pdf", result.Data.ReceiptPdfUrl);
        batches.Verify(repository => repository.CreateAsync(It.Is<PaymentBatch>(batch =>
            batch.Allocations.Count == 2 && batch.Amount == 2300m && batch.Status == PaymentStatus.Succeeded), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateParentTransferAsync_CreatesOnlyTheParentsChildBalanceAsPendingTransfer()
    {
        var enrollment = Enrollment(45, 20, 1000m);
        enrollment.Student.Parents.Add(new Parent { UserId = 10, StudentId = 20 });
        var batches = new Mock<IPaymentBatchRepository>();
        var payments = new Mock<IPaymentRepository>();
        batches.Setup(repository => repository.GetEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);
        batches.Setup(repository => repository.GenerateInvoiceNoAsync(It.IsAny<CancellationToken>())).ReturnsAsync("INV-202610-B123456789");
        batches.Setup(repository => repository.CreateAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentBatch batch, CancellationToken _) => batch);
        payments.Setup(repository => repository.GetSucceededAmountByEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(200m);
        payments.Setup(repository => repository.GetPendingAmountByEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(100m);

        var result = await CreateSut(batches, payments).CreateParentTransferAsync(10, 20, 45);

        Assert.Equal(700m, result.Data.Amount);
        Assert.Equal(PaymentStatus.Pending, result.Data.Status);
        batches.Verify(repository => repository.CreateAsync(It.Is<PaymentBatch>(batch =>
            batch.Method == "transfer" && batch.Status == PaymentStatus.Pending && batch.Amount == 700m
            && batch.Allocations.Single().EnrollmentId == 45), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateParentTransferAsync_RejectsEnrollmentOwnedByAnotherParent()
    {
        var enrollment = Enrollment(45, 20, 1000m);
        enrollment.Student.Parents.Add(new Parent { UserId = 11, StudentId = 20 });
        var batches = new Mock<IPaymentBatchRepository>();
        batches.Setup(repository => repository.GetEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);

        var exception = await Assert.ThrowsAsync<PaymentValidationException>(() =>
            CreateSut(batches).CreateParentTransferAsync(10, 20, 45));

        Assert.Equal("ENROLLMENT_NOT_FOUND", exception.ErrorCode);
        batches.Verify(repository => repository.CreateAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateParentTransferAsync_CreatesBillForSelectedPartialAmount()
    {
        var enrollment = Enrollment(45, 20, 1000m);
        enrollment.Student.Parents.Add(new Parent { UserId = 10, StudentId = 20 });
        var batches = new Mock<IPaymentBatchRepository>();
        var payments = new Mock<IPaymentRepository>();
        SetupBalances(payments, batches);
        batches.Setup(repository => repository.GetEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);
        batches.Setup(repository => repository.GenerateInvoiceNoAsync(It.IsAny<CancellationToken>())).ReturnsAsync("INV-202610-B123456789");
        batches.Setup(repository => repository.CreateAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentBatch batch, CancellationToken _) => batch);

        var result = await CreateSut(batches, payments).CreateParentTransferAsync(10, 20, 45, requestedAmount: 350m);

        Assert.Equal(350m, result.Data.Amount);
        batches.Verify(repository => repository.CreateAsync(It.Is<PaymentBatch>(batch =>
            batch.Amount == 350m && batch.Allocations.Single().Amount == 350m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateParentTransferAsync_RejectsAmountAboveRemainingBalance()
    {
        var enrollment = Enrollment(45, 20, 1000m);
        enrollment.Student.Parents.Add(new Parent { UserId = 10, StudentId = 20 });
        var batches = new Mock<IPaymentBatchRepository>();
        var payments = new Mock<IPaymentRepository>();
        SetupBalances(payments, batches);
        batches.Setup(repository => repository.GetEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);
        payments.Setup(repository => repository.GetSucceededAmountByEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(200m);
        payments.Setup(repository => repository.GetPendingAmountByEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(100m);

        var exception = await Assert.ThrowsAsync<PaymentValidationException>(() =>
            CreateSut(batches, payments).CreateParentTransferAsync(10, 20, 45, requestedAmount: 701m));

        Assert.Equal("AMOUNT_EXCEEDS_BALANCE", exception.ErrorCode);
        batches.Verify(repository => repository.CreateAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateParentOnlinePaymentAsync_CreatesPendingDynamicPromptPayBatch()
    {
        var enrollment = Enrollment(45, 20, 2000m);
        enrollment.Student.Parents.Add(new Parent { UserId = 10, StudentId = 20 });
        var batches = new Mock<IPaymentBatchRepository>();
        var gateway = new Mock<IOmisePromptPayGateway>();
        gateway.SetupGet(provider => provider.IsConfigured).Returns(true);
        batches.Setup(repository => repository.GetEnrollmentAsync(45, It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);
        batches.Setup(repository => repository.GenerateInvoiceNoAsync(It.IsAny<CancellationToken>())).ReturnsAsync("INV-202611-B123456789");
        batches.Setup(repository => repository.CreateAsync(It.IsAny<PaymentBatch>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentBatch batch, CancellationToken _) =>
            {
                batch.Id = 91;
                return batch;
            });
        gateway.Setup(provider => provider.CreateChargeAsync(1250m, "INV-202611-B123456789", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OmiseCharge(
                "chrg_test_91",
                125000,
                "THB",
                "pending",
                "INV-202611-B123456789",
                DateTimeOffset.UtcNow.AddMinutes(15),
                new OmiseChargeSource("promptpay", new OmiseScannableCode("qr", new OmiseQrImage("https://api.omise.co/qr.svg")))));
        batches.Setup(repository => repository.SaveGatewayDetailsAsync(91, "chrg_test_91", "https://api.omise.co/qr.svg", null, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await CreateSut(batches, omiseGateway: gateway).CreateParentOnlinePaymentAsync(
            10, 20, 45, 1250m, "promptpay");

        Assert.Equal(PaymentStatus.Pending, result.Data.Status);
        Assert.Equal("promptpay", result.Data.Method);
        Assert.Equal("https://api.omise.co/qr.svg", result.Data.GatewayQrUrl);
        batches.Verify(repository => repository.CreateAsync(It.Is<PaymentBatch>(batch =>
            batch.Method == "promptpay" && batch.Status == PaymentStatus.Pending && batch.Amount == 1250m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifySlipAsync_VerifiesOneSlipAgainstCombinedBatchTotal()
    {
        var batch = new PaymentBatch
        {
            Id = 20,
            Amount = 2300m,
            Method = "transfer",
            Status = PaymentStatus.Pending,
            SlipUrl = "https://slips.test/batch.png",
            Allocations = [
                new PaymentBatchAllocation { Enrollment = Enrollment(10, 1, 1000m), Amount = 800m },
                new PaymentBatchAllocation { Enrollment = Enrollment(11, 2, 2000m), Amount = 1500m }
            ]
        };
        var batches = new Mock<IPaymentBatchRepository>();
        var provider = new Mock<ISlipVerificationProvider>();
        var receipts = new Mock<IPaymentBatchReceiptService>();
        batches.Setup(repository => repository.GetForVerificationAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(batch);
        batches.Setup(repository => repository.SaveVerifiedSlipAsync(batch, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        provider.Setup(service => service.VerifyAsync(batch.SlipUrl, batch.Amount, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SlipVerificationResult(true, 2300m, "BANK-REF-1", string.Empty, "test"));
        receipts.Setup(service => service.IssueAndNotifyAsync(batch, It.IsAny<CancellationToken>())).ReturnsAsync("https://receipts.test/batch.pdf");

        var result = await CreateSut(batches, receiptService: receipts, verificationProvider: provider)
            .VerifySlipAsync(20, 42);

        Assert.True(result.Verified);
        Assert.Equal(2300m, result.VerifiedAmount);
        Assert.Equal("https://receipts.test/batch.pdf", result.ReceiptPdfUrl);
        Assert.Equal(PaymentStatus.Succeeded, batch.Status);
        provider.Verify(service => service.VerifyAsync(batch.SlipUrl, 2300m, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ConfirmManuallyAsync_PendingTransferBatch_RecordsManualAuditAndSettlesWithoutProvider()
    {
        var batch = new PaymentBatch
        {
            Id = 20,
            Amount = 2300m,
            Method = "transfer",
            Status = PaymentStatus.Pending,
            SlipUrl = "https://slips.test/batch.png",
            Allocations = [new PaymentBatchAllocation { Enrollment = Enrollment(10, 1, 3000m), Amount = 2300m }]
        };
        var batches = new Mock<IPaymentBatchRepository>();
        var provider = new Mock<ISlipVerificationProvider>();
        var receipts = new Mock<IPaymentBatchReceiptService>();
        batches.Setup(repository => repository.GetForVerificationAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(batch);
        batches.Setup(repository => repository.SaveVerifiedSlipAsync(batch, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        receipts.Setup(service => service.IssueAndNotifyAsync(batch, It.IsAny<CancellationToken>())).ReturnsAsync("https://receipts.test/batch.pdf");

        var result = await CreateSut(batches, receiptService: receipts, verificationProvider: provider)
            .ConfirmManuallyAsync(20, 42);

        Assert.True(result.Verified);
        Assert.Null(result.VerifiedAmount);
        Assert.Null(result.TransactionReference);
        Assert.Equal("https://receipts.test/batch.pdf", result.ReceiptPdfUrl);
        Assert.Equal(PaymentStatus.Succeeded, batch.Status);
        Assert.Equal(42, batch.VerifiedBy);
        Assert.Equal("manual", batch.VerificationProvider);
        Assert.Contains("bank_statement", batch.VerificationPayload);
        Assert.Null(batch.SlipAmount);
        Assert.Null(batch.SlipTransRef);
        provider.Verify(service => service.VerifyAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()), Times.Never);
        batches.Verify(repository => repository.SaveVerifiedSlipAsync(batch, It.IsAny<CancellationToken>()), Times.Once);
    }
}
