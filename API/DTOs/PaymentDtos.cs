namespace academy_API.DTOs;

public record CreatePaymentRequest(
    int EnrollmentId,
    decimal Amount,
    string Method,
    string? SlipUrl
);

public record CreatePaymentResponse(
    string Status,
    string Message,
    CreatePaymentData Data
);

public record CreatePaymentData(
    int PaymentId,
    string InvoiceNo,
    string? ReceiptPdfUrl
);

public record PaymentHistoryResponse(
    string Status,
    PaymentHistoryData Data
);

public record PaymentHistoryData(
    List<PaymentHistoryItem> Payments,
    PaymentSummary Summary,
    PaymentPagination Pagination
);

public record PaymentHistoryItem(
    int Id,
    string InvoiceNo,
    string? StudentName,
    string? CourseName,
    decimal Amount,
    string Method,
    DateTime PaidAt,
    string? SlipUrl,
    string? ReceiptPdfUrl
);

public record PaymentSummary(
    decimal TotalAmountInRange
);

public record PaymentPagination(
    int CurrentPage,
    int TotalPages
);
