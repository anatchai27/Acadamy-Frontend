namespace academy_API.Repositories;

public interface IStudentRepository
{
    Task<IEnumerable<Models.Student>> GetAllWithUserAsync(CancellationToken ct = default);
    Task<Models.Student?> GetByIdWithUserAsync(int id, CancellationToken ct = default);
    Task<Models.Student?> GetByIdWithParentsAsync(int id, CancellationToken ct = default);
    Task<Models.Student> CreateAsync(Models.Student student, CancellationToken ct = default);
    Task<Models.Student> CreateWithTransactionAsync(Models.Student student, List<Models.Parent> parents, Models.PdpaConsent pdpa, CancellationToken ct = default);
    Task<Models.Student?> UpdateAsync(int id, DTOs.UpdateStudentRequest request, CancellationToken ct = default);
    Task<Models.Student?> RotateQrTokenAsync(int id, CancellationToken ct = default);
    Task<(List<DTOs.StudentListItem> Items, int TotalCount)> SearchAsync(string? search, int page, int limit, CancellationToken ct = default);
}
