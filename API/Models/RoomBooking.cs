namespace academy_API.Models;

public class RoomBooking : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public string RoomId { get; set; } = null!;
    public int? SessionId { get; set; }
    public DateTime BookedStartAt { get; set; }
    public DateTime BookedEndAt { get; set; }
    public string? Purpose { get; set; }
    public DateTime CreatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public Session? Session { get; set; }
}
