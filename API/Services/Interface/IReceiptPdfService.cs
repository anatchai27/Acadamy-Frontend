namespace academy_API.Services.Interface;

public interface IReceiptPdfService
{
    byte[] Render(ReceiptPdfData data);
    byte[] RenderBatch(ReceiptBatchPdfData data);
}