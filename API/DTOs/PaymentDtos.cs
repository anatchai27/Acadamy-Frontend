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
    long PaymentId,
    string InvoiceNo,
    string? ReceiptPdfUrl
);

public sealed record PaymentBatchAllocationRequest(int EnrollmentId, decimal Amount);

public sealed record CreatePaymentBatchRequest(
    List<PaymentBatchAllocationRequest> Allocations,
    string Method
);

public sealed record CreateParentOnlinePaymentRequest(
    int EnrollmentId,
    decimal Amount,
    string Method,
    string? InstallmentBank = null,
    int? InstallmentTerm = null
);

public sealed record PaymentBatchAllocationResponse(
    int EnrollmentId,
    int StudentId,
    string StudentName,
    string CourseName,
    decimal Amount
);

public sealed record PaymentBatchData(
    long BatchId,
    string InvoiceNo,
    decimal Amount,
    string Status,
    string? ReceiptPdfUrl,
    List<PaymentBatchAllocationResponse> Allocations,
    string? Method = null,
    string? GatewayQrUrl = null,
    string? CheckoutUrl = null,
    DateTime? GatewayExpiresAt = null,
    string? InstallmentBank = null,
    int? InstallmentTerm = null
);

public sealed record PaymentBatchResponse(
    string Status,
    string Message,
    PaymentBatchData Data
);

public sealed record PaymentBatchSlipVerificationResponse(
    long BatchId,
    bool Verified,
    decimal? VerifiedAmount,
    string? TransactionReference,
    string? ReceiptPdfUrl
);

public record PaymentHistoryResponse(
    string Status,
    PaymentHistoryData Data
);

public sealed record PendingSlipReviewResponse(
    int Count,
    List<PaymentHistoryItem> Items,
    int LeaveRequestCount = 0,
    List<LeaveRequestItem>? LeaveRequests = null
);

public record PaymentHistoryData(
    List<PaymentHistoryItem> Payments,
    PaymentSummary Summary,
    PaymentPagination Pagination
);

public record PaymentHistoryItem(
    long Id,
    string InvoiceNo,
    string? StudentName,
    string? CourseName,
    decimal Amount,
    string Method,
    string Status,
    DateTime PaidAt,
    string? SlipUrl,
    string? ReceiptPdfUrl,
    string? CourseNameEn = null,
    bool IsBatch = false,
    long? BatchId = null,
    string? VerificationProvider = null
);

public record PaymentSummary(
    decimal TotalAmountInRange
);

public record PaymentPagination(
    int CurrentPage,
    int TotalPages
);

public record RevenueReportRow(
    string Period,
    decimal GrossAmount,
    int PaymentCount
);
