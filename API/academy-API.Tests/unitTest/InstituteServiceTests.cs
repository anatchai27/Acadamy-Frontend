using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class InstituteServiceTests
{
    [Fact]
    public async Task GetMeAsync_ExistingInstitute_ReturnsPublicSettings()
    {
        var repository = new Mock<IInstituteRepository>();
        repository.Setup(r => r.GetByIdAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Institute
            {
                Id = 7,
                Name = "Academy",
                LogoUrl = "https://cdn.example/logo.png",
                ContactPhone = "0812345678",
                BankName = "ธนาคารตัวอย่าง",
                BankAccountName = "โรงเรียนตัวอย่าง",
                BankAccountNumber = "1234567890",
                PromptPayId = "0812345678",
                PaymentQrImageUrl = "https://storage.test/payment-qr.png",
                IsActive = true
            });
        var service = new InstituteService(repository.Object);

        var result = await service.GetMeAsync(7);

        Assert.NotNull(result);
        Assert.Equal(7, result!.Id);
        Assert.Equal("Academy", result.Name);
        Assert.Equal("https://cdn.example/logo.png", result.LogoUrl);
        Assert.Equal("0812345678", result.ContactPhone);
        Assert.Equal("ธนาคารตัวอย่าง", result.BankName);
        Assert.Equal("โรงเรียนตัวอย่าง", result.BankAccountName);
        Assert.Equal("1234567890", result.BankAccountNumber);
        Assert.Equal("0812345678", result.PromptPayId);
        Assert.Equal("https://storage.test/payment-qr.png", result.PaymentQrImageUrl);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task GetMeAsync_MissingInstitute_ReturnsNull()
    {
        var repository = new Mock<IInstituteRepository>();
        repository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Institute?)null);
        var service = new InstituteService(repository.Object);

        var result = await service.GetMeAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateMeAsync_ExistingInstitute_UpdatesOnlyProvidedFields()
    {
        var institute = new Institute
        {
            Id = 7,
            Name = "Old name",
            ContactPhone = "0800000000",
            BankName = "Old bank",
            UpdatedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        var previousUpdatedAt = institute.UpdatedAt;
        var repository = new Mock<IInstituteRepository>();
        repository.Setup(r => r.GetByIdAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(institute);
        repository.Setup(r => r.UpdateAsync(institute, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new InstituteService(repository.Object);

        var result = await service.UpdateMeAsync(7, new UpdateInstituteRequest(
            "New name", null, BankName: "  New bank  ", BankAccountName: " School ", BankAccountNumber: " 1234 ", PaymentQrImageUrl: " https://storage.test/qr.png "));

        Assert.True(result);
        Assert.Equal("New name", institute.Name);
        Assert.Equal("0800000000", institute.ContactPhone);
        Assert.Equal("New bank", institute.BankName);
        Assert.Equal("School", institute.BankAccountName);
        Assert.Equal("1234", institute.BankAccountNumber);
        Assert.Equal("https://storage.test/qr.png", institute.PaymentQrImageUrl);
        Assert.True(institute.UpdatedAt > previousUpdatedAt);
        repository.Verify(r => r.UpdateAsync(institute, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateMeAsync_MissingInstitute_DoesNotPersist()
    {
        var repository = new Mock<IInstituteRepository>();
        repository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Institute?)null);
        var service = new InstituteService(repository.Object);

        var result = await service.UpdateMeAsync(999, new UpdateInstituteRequest("Name", "Phone"));

        Assert.False(result);
        repository.Verify(r => r.UpdateAsync(It.IsAny<Institute>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
