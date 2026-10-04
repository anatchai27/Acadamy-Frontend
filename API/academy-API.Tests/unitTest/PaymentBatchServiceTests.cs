using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
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
        Mock<ISlipVerificationProvider>? verificationProvider = null) => new(
            batchRepository.Object,
            paymentRepository?.Object ?? Mock.Of<IPaymentRepository>(),
            receiptService?.Object ?? Mock.Of<IPaymentBatchReceiptService>(),
            verificationProvider?.Object ?? Mock.Of<ISlipVerificationProvider>());

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
}
