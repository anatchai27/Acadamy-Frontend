namespace academy_API.Models;

public class Course
{
    public int Id { get; set; }
    public int? InstituteId { get; set; }
    public string Name { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public int TotalSessions { get; set; }
    public decimal Price { get; set; }
    public int? TeacherId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Institute? Institute { get; set; }
    public Teacher? Teacher { get; set; }
}
