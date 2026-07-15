namespace academy_API.Models;

public class MakeupSlot
{
    public int Id { get; set; }
    public int? TeacherId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int Capacity { get; set; }
    public int BookedCount { get; set; }
    public string? RoomId { get; set; }

    public Teacher? Teacher { get; set; }
}
