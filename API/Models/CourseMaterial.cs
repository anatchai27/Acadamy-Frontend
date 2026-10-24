namespace academy_API.Models;

public sealed class CourseMaterial : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int CourseId { get; set; }
    public string ObjectKey { get; set; } = null!;
    public string OriginalFileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public int? UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Course Course { get; set; } = null!;
}