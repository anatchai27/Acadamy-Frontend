namespace academy_API.Services.Interface;

public interface IStudentCardPdfService
{
    byte[] Render(StudentCardPdfData data);
}