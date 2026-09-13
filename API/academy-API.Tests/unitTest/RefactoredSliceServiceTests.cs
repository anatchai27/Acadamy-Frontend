using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Contracts;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace academy_API.Tests.unitTest;

public class MakeupServiceTests
{
    [Fact]
    public async Task CreateBooking_CreditBelongsToAnotherStudent_ThrowsValidationException()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.GetSlotAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(OpenSlot());
        repository.Setup(x => x.GetCreditAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MakeupCredit { Id = 20, StudentId = 2, Status = "available", ExpiresAt = Future() });
        var sut = new MakeupService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<MakeupValidationException>(() =>
            sut.CreateBookingAsync(new CreateMakeupBookingRequest(10, 1, 20), 99, CancellationToken.None));

        // Assert
        Assert.Equal("CREDIT_STUDENT_MISMATCH", exception.Code);
        repository.Verify(x => x.CreateBookingAsync(
            It.IsAny<MakeupSlot>(), It.IsAny<MakeupCredit>(), It.IsAny<MakeupBooking>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBooking_FullSlot_ThrowsConflictValidation()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.GetSlotAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MakeupSlot { Id = 10, Capacity = 1, BookedCount = 1, ScheduledAt = Future() });
        repository.Setup(x => x.GetCreditAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MakeupCredit { Id = 20, StudentId = 1, Status = "available", ExpiresAt = Future() });
        var sut = new MakeupService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<MakeupValidationException>(() =>
            sut.CreateBookingAsync(new CreateMakeupBookingRequest(10, 1, 20), 99, CancellationToken.None));

        // Assert
        Assert.Equal("SLOT_UNAVAILABLE", exception.Code);
        repository.Verify(x => x.CreateBookingAsync(
            It.IsAny<MakeupSlot>(), It.IsAny<MakeupCredit>(), It.IsAny<MakeupBooking>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBooking_ExpiredCredit_ThrowsUnavailableAndDoesNotCreateBooking()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.GetSlotAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(OpenSlot());
        repository.Setup(x => x.GetCreditAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MakeupCredit
            {
                Id = 20,
                StudentId = 1,
                Status = "available",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            });
        var sut = new MakeupService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<MakeupValidationException>(() =>
            sut.CreateBookingAsync(new CreateMakeupBookingRequest(10, 1, 20), 99, CancellationToken.None));

        // Assert
        Assert.Equal("CREDIT_UNAVAILABLE", exception.Code);
        repository.Verify(x => x.CreateBookingAsync(
            It.IsAny<MakeupSlot>(), It.IsAny<MakeupCredit>(), It.IsAny<MakeupBooking>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBooking_ValidCreditAndSlot_CreatesReservedBooking()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        var slot = OpenSlot();
        var credit = new MakeupCredit { Id = 20, StudentId = 1, InstituteId = 1, Status = "available", ExpiresAt = Future() };
        repository.Setup(x => x.GetSlotAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(slot);
        repository.Setup(x => x.GetCreditAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(credit);
        repository.Setup(x => x.CreateBookingAsync(slot, credit, It.IsAny<MakeupBooking>(), 99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((MakeupSlot _, MakeupCredit _, MakeupBooking booking, int? _, CancellationToken _) => booking);
        var sut = new MakeupService(repository.Object);

        // Act
        var result = await sut.CreateBookingAsync(new CreateMakeupBookingRequest(10, 1, 20), 99, CancellationToken.None);

        // Assert
        Assert.Equal(10, result.SlotId);
        Assert.Equal(1, result.StudentId);
        Assert.Equal(20, result.CreditId);
        Assert.Equal("reserved", result.Status);
        repository.Verify(x => x.CreateBookingAsync(
            slot, credit, It.Is<MakeupBooking>(booking => booking.Status == "reserved"), 99, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkNoShow_ReservedBooking_ConsumesCredit()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        var booking = new MakeupBooking { Id = 30, SlotId = 10, StudentId = 1, CreditId = 20, Status = "reserved" };
        var credit = new MakeupCredit { Id = 20, StudentId = 1, Status = "reserved", ExpiresAt = Future() };
        repository.Setup(x => x.GetBookingAsync(30, It.IsAny<CancellationToken>())).ReturnsAsync(booking);
        repository.Setup(x => x.GetCreditAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(credit);
        var sut = new MakeupService(repository.Object);

        // Act
        var result = await sut.MarkNoShowAsync(30, 99, CancellationToken.None);

        // Assert
        Assert.Equal("reserved", result.Status);
        repository.Verify(x => x.MarkNoShowAsync(booking, credit, 99, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CancelBooking_ReservedBooking_DelegatesRestoreTransaction()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        var booking = new MakeupBooking { Id = 30, SlotId = 10, StudentId = 1, CreditId = 20, Status = "reserved" };
        var credit = new MakeupCredit { Id = 20, StudentId = 1, Status = "reserved", ExpiresAt = Future() };
        var slot = OpenSlot();
        repository.Setup(x => x.GetBookingAsync(30, It.IsAny<CancellationToken>())).ReturnsAsync(booking);
        repository.Setup(x => x.GetCreditAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(credit);
        repository.Setup(x => x.GetSlotAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(slot);
        var sut = new MakeupService(repository.Object);

        // Act
        await sut.CancelBookingAsync(30, 99, null, false, CancellationToken.None);

        // Assert
        repository.Verify(x => x.CancelBookingAsync(booking, credit, slot, 99, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListBookings_ParentOwnsStudent_ReturnsBookings()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.ParentOwnsStudentAsync(7, 1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        repository.Setup(x => x.ListBookingsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync([
            new MakeupBookingListItem(30, 10, 1, 20, 4, Future(), "A1", "reserved", DateTime.UtcNow, null)]);
        var sut = new MakeupService(repository.Object);

        // Act
        var result = await sut.ListBookingsAsync(1, 7, true, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(30, result[0].Id);
        repository.Verify(x => x.ListBookingsAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListBookings_ParentDoesNotOwnStudent_ThrowsForbidden()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.ParentOwnsStudentAsync(7, 2, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var sut = new MakeupService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<MakeupValidationException>(() =>
            sut.ListBookingsAsync(2, 7, true, CancellationToken.None));

        // Assert
        Assert.Equal("FORBIDDEN", exception.Code);
        repository.Verify(x => x.ListBookingsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CancelBooking_ParentDoesNotOwnBooking_ThrowsForbidden()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.ParentOwnsBookingAsync(7, 30, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var sut = new MakeupService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<MakeupValidationException>(() =>
            sut.CancelBookingAsync(30, 7, 7, true, CancellationToken.None));

        // Assert
        Assert.Equal("FORBIDDEN", exception.Code);
        repository.Verify(x => x.GetBookingAsync(It.IsAny<long>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CancelBooking_CancelledBooking_ThrowsConflictValidation()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.GetBookingAsync(30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MakeupBooking { Id = 30, Status = "cancelled" });
        var sut = new MakeupService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<MakeupValidationException>(() =>
            sut.CancelBookingAsync(30, 7, null, false, CancellationToken.None));

        // Assert
        Assert.Equal("INVALID_STATE", exception.Code);
        repository.Verify(x => x.CancelBookingAsync(It.IsAny<MakeupBooking>(), It.IsAny<MakeupCredit>(), It.IsAny<MakeupSlot?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CancelSlot_ExistingSlot_DelegatesRestoreAllReservations()
    {
        // Arrange
        var repository = new Mock<IMakeupRepository>();
        repository.Setup(x => x.GetSlotAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(OpenSlot());
        var sut = new MakeupService(repository.Object);

        // Act
        await sut.CancelSlotAsync(10, 99, CancellationToken.None);

        // Assert
        repository.Verify(x => x.CancelSlotAsync(10, 99, It.IsAny<CancellationToken>()), Times.Once);
    }

    private static MakeupSlot OpenSlot() => new() { Id = 10, Capacity = 5, BookedCount = 0, ScheduledAt = Future() };
    private static DateTime Future() => DateTime.UtcNow.AddHours(2);
}

public class StudentPickupServiceTests
{
    [Fact]
    public async Task Create_InvalidIdCardLast4_ThrowsValidationException()
    {
        // Arrange
        var repository = new Mock<IStudentPickupRepository>();
        var sut = new StudentPickupService(repository.Object, CreateDb().Context);
        var request = new CreatePickupAuthorizationRequest("ผู้รับ", "0812345678", "แม่", "12A4");

        // Act
        var exception = await Assert.ThrowsAsync<StudentPickupValidationException>(() =>
            sut.CreateAsync(1, request, 99, CancellationToken.None));

        // Assert
        Assert.Equal("INVALID_ID_CARD", exception.Code);
        repository.Verify(x => x.AddAsync(It.IsAny<StudentPickupAuthorization>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ActiveAuthorization_RevokesAuthorization()
    {
        // Arrange
        var repository = new Mock<IStudentPickupRepository>();
        var authorization = new StudentPickupAuthorization { Id = 5, StudentId = 1, FullName = "ผู้รับ", IsActive = true };
        repository.Setup(x => x.GetAsync(1, 5, It.IsAny<CancellationToken>())).ReturnsAsync(authorization);
        var sut = new StudentPickupService(repository.Object, CreateDb().Context);

        // Act
        await sut.DeleteAsync(1, 5, CancellationToken.None);

        // Assert
        Assert.False(authorization.IsActive);
        Assert.NotNull(authorization.RevokedAt);
        repository.Verify(x => x.SaveAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static DbHandle CreateDb()
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new DbHandle(new TutoringDbContext(options, new MockTenantProvider()));
    }

    private sealed record DbHandle(TutoringDbContext Context) : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => Context.DisposeAsync();
    }
}

public class AttendanceCheckoutServiceTests
{
    [Fact]
    public async Task Checkout_BeforeCheckin_ThrowsValidationException()
    {
        // Arrange
        var repository = new Mock<IAttendanceRepository>();
        repository.Setup(x => x.GetForCheckoutAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Attendance { Id = 50, StudentId = 1, SessionId = 10, Status = "absent" });
        var sut = new AttendanceService(repository.Object, Mock.Of<IBackgroundNotificationDispatcher>());

        // Act
        var exception = await Assert.ThrowsAsync<AttendanceValidationException>(() =>
            sut.CheckoutAsync(50, new CheckoutAttendanceRequest("แม่", null), 99, CancellationToken.None));

        // Assert
        Assert.Equal("CHECKIN_REQUIRED", exception.ErrorCode);
        repository.Verify(x => x.SaveCheckoutAsync(It.IsAny<Attendance>(), It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Checkout_AlreadyCheckedOut_ThrowsValidationException()
    {
        // Arrange
        var repository = new Mock<IAttendanceRepository>();
        repository.Setup(x => x.GetForCheckoutAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Attendance { Id = 50, StudentId = 1, SessionId = 10, Status = "present", CheckinAt = DateTime.UtcNow.AddHours(-1), CheckoutAt = DateTime.UtcNow.AddMinutes(-5) });
        var sut = new AttendanceService(repository.Object, Mock.Of<IBackgroundNotificationDispatcher>());

        // Act
        var exception = await Assert.ThrowsAsync<AttendanceValidationException>(() =>
            sut.CheckoutAsync(50, new CheckoutAttendanceRequest("แม่", null), 99, CancellationToken.None));

        // Assert
        Assert.Equal("ALREADY_CHECKED_OUT", exception.ErrorCode);
        repository.Verify(x => x.SaveCheckoutAsync(It.IsAny<Attendance>(), It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Checkout_RevokedPickupAuthorization_ThrowsValidationException()
    {
        // Arrange
        var repository = new Mock<IAttendanceRepository>();
        repository.Setup(x => x.GetForCheckoutAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Attendance { Id = 50, StudentId = 1, SessionId = 10, Status = "present", CheckinAt = DateTime.UtcNow.AddHours(-1) });
        repository.Setup(x => x.GetPickupAuthorizationAsync(7, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StudentPickupAuthorization?)null);
        var sut = new AttendanceService(repository.Object, Mock.Of<IBackgroundNotificationDispatcher>());

        // Act
        var exception = await Assert.ThrowsAsync<AttendanceValidationException>(() =>
            sut.CheckoutAsync(50, new CheckoutAttendanceRequest(null, 7), 99, CancellationToken.None));

        // Assert
        Assert.Equal("INVALID_PICKUP_AUTHORIZATION", exception.ErrorCode);
        repository.Verify(x => x.SaveCheckoutAsync(It.IsAny<Attendance>(), It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Checkout_AlreadyCheckedOut_DoesNotSaveAgain()
    {
        // Arrange
        var repository = new Mock<IAttendanceRepository>();
        repository.Setup(x => x.GetForCheckoutAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Attendance { Id = 50, StudentId = 1, SessionId = 10, Status = "present", CheckinAt = DateTime.UtcNow.AddHours(-1), CheckoutAt = DateTime.UtcNow.AddMinutes(-1) });
        var sut = new AttendanceService(repository.Object, Mock.Of<IBackgroundNotificationDispatcher>());

        // Act
        var exception = await Assert.ThrowsAsync<AttendanceValidationException>(() =>
            sut.CheckoutAsync(50, new CheckoutAttendanceRequest("แม่", null), 99, CancellationToken.None));

        // Assert
        Assert.Equal("ALREADY_CHECKED_OUT", exception.ErrorCode);
        repository.Verify(x => x.SaveCheckoutAsync(It.IsAny<Attendance>(), It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Checkout_ValidAuthorization_SavesAuthorizedPickupName()
    {
        // Arrange
        var repository = new Mock<IAttendanceRepository>();
        var attendance = new Attendance { Id = 50, StudentId = 1, SessionId = 10, Status = "present", CheckinAt = DateTime.UtcNow.AddHours(-1) };
        var authorization = new StudentPickupAuthorization { Id = 7, StudentId = 1, FullName = "แม่สมใจ", IsActive = true };
        repository.Setup(x => x.GetForCheckoutAsync(50, It.IsAny<CancellationToken>())).ReturnsAsync(attendance);
        repository.Setup(x => x.GetPickupAuthorizationAsync(7, 1, It.IsAny<CancellationToken>())).ReturnsAsync(authorization);
        var sut = new AttendanceService(repository.Object, Mock.Of<IBackgroundNotificationDispatcher>());

        // Act
        var result = await sut.CheckoutAsync(50, new CheckoutAttendanceRequest(null, 7), 99, CancellationToken.None);

        // Assert
        Assert.Equal("แม่สมใจ", result.PickedUpBy);
        Assert.Equal(7, result.PickupAuthorizationId);
        Assert.NotEqual(default, result.CheckoutAt);
        repository.Verify(x => x.SaveCheckoutAsync(attendance, It.Is<AuditLog>(audit =>
            audit.Action == "checkout" && audit.EntityType == "Attendance" && audit.EntityId == "50" && audit.UserId == 99), It.IsAny<CancellationToken>()), Times.Once);
    }
}
