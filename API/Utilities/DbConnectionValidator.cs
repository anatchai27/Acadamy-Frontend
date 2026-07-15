using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace academy_API.Utilities;

public interface IDbConnectionValidator
{
    ValidationResult ValidateConnection();
}

public class ValidationResult
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ConnectionString { get; set; }
}

public class DbConnectionValidator : IDbConnectionValidator
{
    private readonly IConfiguration _configuration;

    public DbConnectionValidator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public ValidationResult ValidateConnection()
    {
        var result = new ValidationResult();

        var connectionString = _configuration.GetConnectionString("TutoringDbConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            result.IsSuccess = false;
            result.Message = "ไม่พบการตั้งค่า Connection String ในระบบ";
            return result;
        }

        result.ConnectionString = connectionString;

        try
        {
            using var connection = new MySqlConnection(connectionString);
            connection.Open();
            connection.Close();
            
            result.IsSuccess = true;
            result.Message = "การเชื่อมต่อฐานข้อมูลสำเร็จ";
        }
        catch (MySqlException ex)
        {
            result.IsSuccess = false;
            result.Message = $"การเชื่อมต่อฐานข้อมูลล้มเหลว: {ex.Message}";
        }
        catch (Exception ex)
        {
            result.IsSuccess = false;
            result.Message = $"เกิดข้อผิดพลาดที่ไม่คาดคิด: {ex.Message}";
        }

        return result;
    }
}
