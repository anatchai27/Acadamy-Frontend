using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class PaymentSlipVerificationServiceTests
{
    [Fact]
    public async Task VerifyAsync_MatchingAmount_MarksPaymentVerified()
    {
        // Arrange
        var repository = new Mock<IPaymentRepository>();
        var provider = new Mock<ISlipVerificationProvider>();
        var payment = new Payment { Id = 5, Amount = 1200m, SlipUrl = "https://slip.test/5.png", Status = "pending" };
        repository.Setup(x => x.GetPaymentForVerificationAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(payment);
        provider.Setup(x => x.VerifyAsync(payment.SlipUrl, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SlipVerificationResult(true, 1200m, "REF-5", "verified", "mock"));
        var sut = new PaymentSlipVerificationService(repository.Object, provider.Object);

        // Act
        var result = await sut.VerifyAsync(5, 99, CancellationToken.None);

        // Assert
        Assert.True(result.Verified);
        Assert.Equal("verified", payment.Status);
        Assert.Equal(1200m, payment.SlipAmount);
        Assert.Equal("REF-5", payment.SlipTransRef);
        Assert.Equal(99, payment.VerifiedBy);
        repository.Verify(x => x.SaveVerifiedSlipAsync(payment, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyAsync_MismatchedAmount_DoesNotPersistVerification()
    {
        // Arrange
        var repository = new Mock<IPaymentRepository>();
        var provider = new Mock<ISlipVerificationProvider>();
        var payment = new Payment { Id = 5, Amount = 1200m, SlipUrl = "https://slip.test/5.png", Status = "pending" };
        repository.Setup(x => x.GetPaymentForVerificationAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(payment);
        provider.Setup(x => x.VerifyAsync(payment.SlipUrl, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SlipVerificationResult(true, 1000m, "REF-5", "verified", "mock"));
        var sut = new PaymentSlipVerificationService(repository.Object, provider.Object);

        // Act
        var exception = await Assert.ThrowsAsync<PaymentValidationException>(() => sut.VerifyAsync(5, 99, CancellationToken.None));

        // Assert
        Assert.Equal("AMOUNT_MISMATCH", exception.ErrorCode);
        Assert.Equal("pending", payment.Status);
        repository.Verify(x => x.SaveVerifiedSlipAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task VerifyAsync_ProviderUnavailable_DoesNotPersistVerification()
    {
        // Arrange
        var repository = new Mock<IPaymentRepository>();
        var provider = new Mock<ISlipVerificationProvider>();
        var payment = new Payment { Id = 5, Amount = 1200m, SlipUrl = "https://slip.test/5.png", Status = "pending" };
        repository.Setup(x => x.GetPaymentForVerificationAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(payment);
        provider.Setup(x => x.VerifyAsync(payment.SlipUrl, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SlipVerificationResult(false, null, null, "provider unavailable", "mock"));
        var sut = new PaymentSlipVerificationService(repository.Object, provider.Object);

        // Act
        var exception = await Assert.ThrowsAsync<PaymentValidationException>(() => sut.VerifyAsync(5, 99, CancellationToken.None));

        // Assert
        Assert.Equal("VERIFICATION_UNAVAILABLE", exception.ErrorCode);
        repository.Verify(x => x.SaveVerifiedSlipAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
