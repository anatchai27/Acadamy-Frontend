using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public sealed class LeadServiceTests
{
    [Fact]
    public async Task CreateAsync_ValidRequest_ResolvesInstituteAndPersistsLead()
    {
        var repository = new Mock<ILeadRepository>();
        repository.Setup(x => x.GetActiveInstituteBySlugAsync("academy", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Institute { Id = 7, Slug = "academy", IsActive = true });
        repository.Setup(x => x.CreateAsync(It.IsAny<Lead>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lead lead, CancellationToken _) => { lead.Id = 42; return lead; });

        var service = new LeadService(repository.Object);
        var result = await service.CreateAsync(new CreateLeadRequest(
            "academy", " Parent ", " 0812345678 ", "parent@example.com", "Student", "Math", "Call back"));

        Assert.Equal(42, result.Id);
        Assert.Equal("created", result.Status);
        repository.Verify(x => x.CreateAsync(It.Is<Lead>(lead =>
            lead.InstituteId == 7 &&
            lead.FullName == "Parent" &&
            lead.Phone == "0812345678" &&
            lead.StudentName == "Student" &&
            lead.Status == "new" &&
            lead.Source == "public_trial_class"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_MissingRequiredValue_RejectsBeforeRepository()
    {
        var repository = new Mock<ILeadRepository>();
        var service = new LeadService(repository.Object);

        var exception = await Assert.ThrowsAsync<LeadValidationException>(() =>
            service.CreateAsync(new CreateLeadRequest("academy", "", "0812345678", null, null, null, null)));

        Assert.Equal("CONTACT_NAME_REQUIRED", exception.Code);
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateAsync_UnknownInstitute_RejectsWithoutCreatingLead()
    {
        var repository = new Mock<ILeadRepository>();
        repository.Setup(x => x.GetActiveInstituteBySlugAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Institute?)null);
        var service = new LeadService(repository.Object);

        var exception = await Assert.ThrowsAsync<LeadValidationException>(() =>
            service.CreateAsync(new CreateLeadRequest("missing", "Parent", "0812345678", null, null, null, null)));

        Assert.Equal("INSTITUTE_NOT_FOUND", exception.Code);
        repository.Verify(x => x.CreateAsync(It.IsAny<Lead>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
