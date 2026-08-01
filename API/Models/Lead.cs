namespace academy_API.Models;

public class Lead : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string? Email { get; set; }
    public string? Grade { get; set; }
    public string? InterestedSubjects { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = null!;
    public int? AssignedTo { get; set; }
    public string? Notes { get; set; }
    public int? TrialSessionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public User? AssignedToUser { get; set; }
    public Session? TrialSession { get; set; }
}
