using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public sealed class EnrollmentServiceTests
{
    [Fact]
    public async Task EnrollAsync_SetsInstituteFromCourseForRosterVisibility()
    {
        var repository = new Mock<IEnrollmentRepository>();
        repository.Setup(x => x.GetCourseByIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Course { Id = 12, InstituteId = 7, Name = "Math" });
        repository.Setup(x => x.GetStudentByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 5, InstituteId = 7, FullName = "Student" });
        repository.Setup(x => x.GetUpcomingSessionCountAsync(12, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(4);
        repository.Setup(x => x.ExistsActiveEnrollmentAsync(5, 12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        repository.Setup(x => x.CreateAsync(It.IsAny<Enrollment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Enrollment enrollment, CancellationToken _) =>
            {
                enrollment.Id = 33;
                return enrollment;
            });

        var service = new EnrollmentService(repository.Object);
        var result = await service.EnrollAsync(new EnrollStudentRequest(5, 12));

        Assert.Equal(33, result.Data.EnrollmentId);
        repository.Verify(x => x.CreateAsync(It.Is<Enrollment>(enrollment =>
            enrollment.StudentId == 5 &&
            enrollment.CourseId == 12 &&
            enrollment.InstituteId == 7 &&
            enrollment.SessionsRemaining == 4), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EnrollAsync_RejectsStudentOutsideCourseInstitute()
    {
        var repository = new Mock<IEnrollmentRepository>();
        repository.Setup(x => x.GetCourseByIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Course { Id = 12, InstituteId = 7, Name = "Math" });
        repository.Setup(x => x.GetStudentByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 5, InstituteId = 8, FullName = "Other tenant student" });

        var service = new EnrollmentService(repository.Object);
        var exception = await Assert.ThrowsAsync<EnrollmentValidationException>(() =>
            service.EnrollAsync(new EnrollStudentRequest(5, 12)));

        Assert.Equal("STUDENT_NOT_FOUND", exception.ErrorCode);
        repository.Verify(x => x.CreateAsync(It.IsAny<Enrollment>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
