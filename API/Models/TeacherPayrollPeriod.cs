namespace academy_API.Models;

public class TeacherPayrollPeriod : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int TeacherId { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public decimal TotalHours { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
}
