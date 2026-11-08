using System.Text.Json;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Repositories.Interface;
using academy_API.Services.Interface;

namespace academy_API.Services;

public sealed class PaymentBatchService(
    IPaymentBatchRepository repository,
    IPaymentRepository paymentRepository,
    IPaymentBatchReceiptService receiptService,
    ISlipVerificationProvider verificationProvider,
    IOmisePromptPayGateway? omiseGateway = null) : IPaymentBatchService
{
    public async Task<PaymentBatchResponse> CreateAsync(CreatePaymentBatchRequest request, CancellationToken ct = default)
    {
        if (request.Allocations is null || request.Allocations.Count == 0)
            throw new PaymentValidationException("ALLOCATIONS_REQUIRED", "เลือกอย่างน้อยหนึ่งรายการคอร์สเพื่อรับชำระ");
        if (request.Allocations.Count > 100)
            throw new PaymentValidationException("TOO_MANY_ALLOCATIONS", "บิลหนึ่งใบรองรับได้ไม่เกิน 100 รายการ");

        var method = request.Method.Trim().ToLowerInvariant();
        if (method is not ("cash" or "transfer"))
            throw new PaymentValidationException("INVALID_METHOD", "บิลรวมรองรับการชำระด้วยเงินสดหรือโอนเงิน");

        if (request.Allocations.Any(allocation => allocation.EnrollmentId <= 0 || allocation.Amount <= 0))
            throw new PaymentValidationException("INVALID_ALLOCATION", "ยอดจัดสรรแต่ละรายการต้องมากกว่า 0");
        if (request.Allocations.Select(allocation => allocation.EnrollmentId).Distinct().Count() != request.Allocations.Count)
            throw new PaymentValidationException("DUPLICATE_ENROLLMENT", "มีรายการลงทะเบียนซ้ำในบิล");

        var allocations = new List<PaymentBatchAllocation>();
        int? instituteId = null;
        foreach (var requestAllocation in request.Allocations)
        {
            var enrollment = await repository.GetEnrollmentAsync(requestAllocation.EnrollmentId, ct)
                ?? throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบรายการลงทะเบียนที่เลือก");

            if (instituteId.HasValue && instituteId.Value != enrollment.InstituteId)
                throw new PaymentValidationException("MIXED_INSTITUTES", "รวมรายการจากคนละสถาบันในบิลเดียวไม่ได้");
            instituteId = enrollment.InstituteId;

            var succeeded = await paymentRepository.GetSucceededAmountByEnrollmentAsync(enrollment.Id, ct);
            var pending = await paymentRepository.GetPendingAmountByEnrollmentAsync(enrollment.Id, ct);
            var due = Math.Max(enrollment.Course.Price - succeeded - pending, 0m);
            if (requestAllocation.Amount > due + 0.001m)
                throw new PaymentValidationException("AMOUNT_EXCEEDS_BALANCE", $"ยอดชำระของคอร์ส {enrollment.Course.Name} เกินยอดคงเหลือ");

            allocations.Add(new PaymentBatchAllocation
            {
                EnrollmentId = enrollment.Id,
                Enrollment = enrollment,
                Amount = decimal.Round(requestAllocation.Amount, 2, MidpointRounding.AwayFromZero),
            });
        }

        var now = DateTime.UtcNow;
        var batch = await repository.CreateAsync(new PaymentBatch
        {
            InstituteId = instituteId!.Value,
            InvoiceNo = await repository.GenerateInvoiceNoAsync(ct),
            Amount = allocations.Sum(allocation => allocation.Amount),
            Method = method,
            Status = method == "transfer" ? PaymentStatus.Pending : PaymentStatus.Succeeded,
            PaidAt = now,
            CreatedAt = now,
            Allocations = allocations,
        }, ct);

        string? receiptUrl = null;
        var message = method == "transfer" ? "สร้างบิลรวมแล้ว กรุณาแนบสลิปยอดรวม" : "รับชำระและจัดสรรยอดเรียบร้อยแล้ว";
        if (batch.Status == PaymentStatus.Succeeded)
        {
            try
            {
                receiptUrl = await receiptService.IssueAndNotifyAsync(batch, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                message = "รับชำระแล้ว แต่สร้างใบเสร็จไม่สำเร็จ สามารถออกใบเสร็จใหม่จากประวัติการเงิน";
            }
        }

        batch.ReceiptPdfUrl = receiptUrl;
        return ToResponse(batch, message);
    }

    public async Task<PaymentBatchResponse> CreateParentTransferAsync(
        int parentUserId,
        int studentId,
        int enrollmentId,
        CancellationToken ct = default,
        decimal? requestedAmount = null)
    {
        var enrollment = await repository.GetEnrollmentAsync(enrollmentId, ct);
        if (enrollment is null
            || enrollment.StudentId != studentId
            || !enrollment.Student.Parents.Any(parent => parent.UserId == parentUserId))
            throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบรายการลงทะเบียนที่เลือก");

        var succeeded = await paymentRepository.GetSucceededAmountByEnrollmentAsync(enrollmentId, ct);
        var pending = await paymentRepository.GetPendingAmountByEnrollmentAsync(enrollmentId, ct);
        var amountDue = Math.Max(enrollment.Course.Price - succeeded - pending, 0m);
        if (amountDue <= 0m)
            throw new PaymentValidationException("BALANCE_ALREADY_RESERVED", "ยอดนี้ถูกชำระหรืออยู่ระหว่างตรวจสอบแล้ว");

        var amount = decimal.Round(requestedAmount ?? amountDue, 2, MidpointRounding.AwayFromZero);
        if (amount <= 0m)
            throw new PaymentValidationException("INVALID_AMOUNT", "จำนวนเงินต้องมากกว่า 0");
        if (amount > amountDue + 0.001m)
            throw new PaymentValidationException("AMOUNT_EXCEEDS_BALANCE", "ยอดชำระเกินยอดคงเหลือของรายการนี้");

        return await CreateAsync(new CreatePaymentBatchRequest(
            [new PaymentBatchAllocationRequest(enrollmentId, amount)],
            "transfer"), ct);
    }

    public async Task<PaymentBatchResponse> CreateParentOnlinePaymentAsync(
        int parentUserId,
        int studentId,
        int enrollmentId,
        decimal requestedAmount,
        string method,
        string? installmentBank = null,
        int? installmentTerm = null,
        CancellationToken ct = default)
    {
        method = method.Trim().ToLowerInvariant();
        if (method is not ("promptpay" or "credit_card_installment"))
            throw new PaymentValidationException("INVALID_METHOD", "เลือก PromptPay หรือผ่อนชำระด้วยบัตรเครดิต");
        if (omiseGateway is null || !omiseGateway.IsConfigured)
            throw new PaymentValidationException("PAYMENT_PROVIDER_UNAVAILABLE", "ช่องทางชำระออนไลน์ยังไม่พร้อมใช้งาน กรุณาโอนเงินและส่งสลิปแทน");
        if (method == "credit_card_installment" && !omiseGateway.InstallmentsEnabled)
            throw new PaymentValidationException("INSTALLMENTS_UNAVAILABLE", "บัญชีรับชำระยังไม่ได้เปิดใช้การผ่อนบัตรเครดิต");
        if (method == "credit_card_installment" && (string.IsNullOrWhiteSpace(installmentBank) || !installmentTerm.HasValue))
            throw new PaymentValidationException("INSTALLMENT_PLAN_REQUIRED", "เลือกธนาคารและจำนวนงวดก่อนดำเนินการ");
        if (requestedAmount < 20m || requestedAmount > 150_000m || requestedAmount * 100m != decimal.Truncate(requestedAmount * 100m))
            throw new PaymentValidationException("INVALID_AMOUNT", "ยอดชำระออนไลน์ต้องอยู่ระหว่าง 20 ถึง 150,000 บาท และไม่เกิน 2 ตำแหน่งทศนิยม");
        if (method == "credit_card_installment"
            && !omiseGateway.IsInstallmentPlanAvailable(requestedAmount, installmentBank!, installmentTerm!.Value))
            throw new PaymentValidationException("INSTALLMENT_PLAN_UNAVAILABLE", "ยอดนี้ไม่เข้าเงื่อนไขธนาคารหรือจำนวนงวดที่เลือก");

        var enrollment = await repository.GetEnrollmentAsync(enrollmentId, ct);
        if (enrollment is null
            || enrollment.StudentId != studentId
            || !enrollment.Student.Parents.Any(parent => parent.UserId == parentUserId))
            throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบรายการลงทะเบียนที่เลือก");

        var succeeded = await paymentRepository.GetSucceededAmountByEnrollmentAsync(enrollmentId, ct);
        var pending = await paymentRepository.GetPendingAmountByEnrollmentAsync(enrollmentId, ct);
        var amountDue = Math.Max(enrollment.Course.Price - succeeded - pending, 0m);
        var amount = decimal.Round(requestedAmount, 2, MidpointRounding.AwayFromZero);
        if (amount <= 0m)
            throw new PaymentValidationException("INVALID_AMOUNT", "จำนวนเงินต้องมากกว่า 0");
        if (amount > amountDue + 0.001m)
            throw new PaymentValidationException("AMOUNT_EXCEEDS_BALANCE", "ยอดชำระเกินยอดคงเหลือของรายการนี้");

        var invoiceNo = await repository.GenerateInvoiceNoAsync(ct);
        var batch = await repository.CreateAsync(new PaymentBatch
        {
            InstituteId = enrollment.InstituteId,
            InvoiceNo = invoiceNo,
            Amount = amount,
            Method = method,
            Status = PaymentStatus.Pending,
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            InstallmentBank = method == "credit_card_installment" ? installmentBank : null,
            InstallmentTerm = method == "credit_card_installment" ? installmentTerm : null,
            Allocations = [new PaymentBatchAllocation { EnrollmentId = enrollment.Id, Enrollment = enrollment, Amount = amount }]
        }, ct);

        try
        {
            var charge = method == "promptpay"
                ? await omiseGateway.CreateChargeAsync(amount, invoiceNo, $"ค่าเรียน {enrollment.Course.Name}", ct)
                : await omiseGateway.CreateInstallmentChargeAsync(
                    amount,
                    invoiceNo,
                    $"ค่าเรียน {enrollment.Course.Name}",
                    installmentBank!,
                    installmentTerm!.Value,
                    studentId,
                    batch.Id,
                    ct);

            if (charge.Amount != decimal.ToInt64(amount * 100m)
                || !string.Equals(charge.Currency, "THB", StringComparison.OrdinalIgnoreCase)
                || !string.Equals(charge.ReferenceId, invoiceNo, StringComparison.Ordinal))
                throw new InvalidOperationException("Omise returned a charge that does not match the requested payment.");

            var qrUrl = method == "promptpay" ? charge.Source?.ScannableCode?.Image?.DownloadUri : null;
            var checkoutUrl = method == "credit_card_installment" ? charge.AuthorizeUri : null;
            if (method == "promptpay" && !IsOmiseUrl(qrUrl)
                || method == "credit_card_installment" && !IsOmiseUrl(checkoutUrl))
                throw new InvalidOperationException("Omise did not return a valid payment URL.");

            var expiresAt = charge.ExpiresAt?.UtcDateTime;
            if (!await repository.SaveGatewayDetailsAsync(batch.Id, charge.Id, qrUrl, checkoutUrl, expiresAt, ct))
                throw new InvalidOperationException("The payment batch could not be updated with gateway details.");

            batch.GatewayRefId = charge.Id;
            batch.GatewayQrUrl = qrUrl;
            batch.CheckoutUrl = checkoutUrl;
            batch.GatewayExpiresAt = expiresAt;
            return ToResponse(batch, method == "promptpay"
                ? "สร้าง QR พร้อมเพย์ตามยอดนี้แล้ว ชำระผ่าน QR และกดตรวจสอบสถานะได้ที่รายการนี้"
                : "เตรียมรายการผ่อนแล้ว ดำเนินการต่อบนหน้าชำระเงินที่ปลอดภัยของ Omise");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or InvalidOperationException or ArgumentException)
        {
            await repository.UpdateGatewayStatusAsync(batch.Id, PaymentStatus.Failed, DateTime.UtcNow, ct);
            throw new PaymentValidationException("PAYMENT_GATEWAY_ERROR", "สร้างรายการชำระไม่สำเร็จ กรุณาลองใหม่หรือเลือกโอนเงิน");
        }
    }

    public async Task<PaymentBatchResponse> RefreshParentOnlinePaymentAsync(
        int parentUserId,
        int studentId,
        long batchId,
        CancellationToken ct = default)
    {
        var batch = await repository.GetForVerificationAsync(batchId, ct)
            ?? throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลชำระเงิน");
        if (!batch.Allocations.Any(allocation => allocation.Enrollment.StudentId == studentId
            && allocation.Enrollment.Student.Parents.Any(parent => parent.UserId == parentUserId)))
            throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลชำระเงิน");
        if (batch.Method is not ("promptpay" or "credit_card_installment") || string.IsNullOrWhiteSpace(batch.GatewayRefId))
            throw new PaymentValidationException("PAYMENT_STATUS_UNAVAILABLE", "รายการนี้ไม่มีสถานะจากระบบชำระออนไลน์");
        if (batch.Status != PaymentStatus.Pending)
            return ToResponse(batch, batch.Status == PaymentStatus.Succeeded ? "ชำระสำเร็จแล้ว" : "รายการชำระนี้ไม่สำเร็จ กรุณาสร้างรายการใหม่");
        if (omiseGateway is null || !omiseGateway.IsConfigured)
            throw new PaymentValidationException("PAYMENT_PROVIDER_UNAVAILABLE", "ตรวจสอบสถานะการชำระไม่ได้ในขณะนี้");

        var charge = await omiseGateway.GetChargeAsync(batch.GatewayRefId, ct);
        if (charge.Amount != decimal.ToInt64(batch.Amount * 100m)
            || !string.Equals(charge.Currency, "THB", StringComparison.OrdinalIgnoreCase)
            || !string.Equals(charge.ReferenceId, batch.InvoiceNo, StringComparison.Ordinal))
            throw new PaymentValidationException("PAYMENT_REFERENCE_MISMATCH", "ข้อมูลยอดชำระจากผู้ให้บริการไม่ตรงกับบิล กรุณาติดต่อสถาบัน");

        if (charge.Status == "successful" && charge.Paid)
        {
            if (await repository.UpdateGatewayStatusAsync(batch.Id, PaymentStatus.Succeeded, DateTime.UtcNow, ct))
            {
                batch.Status = PaymentStatus.Succeeded;
                batch.PaidAt = DateTime.UtcNow;
            }
            if (batch.Status == PaymentStatus.Succeeded && string.IsNullOrWhiteSpace(batch.ReceiptPdfUrl))
            {
                try { batch.ReceiptPdfUrl = await receiptService.IssueAndNotifyAsync(batch, ct); }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch { /* Payment settlement remains final if receipt delivery needs a retry. */ }
            }
            return ToResponse(batch, "ชำระสำเร็จแล้ว");
        }

        if (charge.Status is "failed" or "expired" or "reversed")
        {
            await repository.UpdateGatewayStatusAsync(batch.Id, PaymentStatus.Failed, DateTime.UtcNow, ct);
            batch.Status = PaymentStatus.Failed;
            return ToResponse(batch, "รายการชำระไม่สำเร็จหรือหมดอายุ กรุณาสร้างรายการใหม่");
        }

        return ToResponse(batch, "ยังไม่พบการชำระสำเร็จ กดตรวจสอบอีกครั้งหลังชำระเงิน");
    }

    public async Task<PaymentBatchSlipVerificationResponse> VerifySlipAsync(long batchId, int? actorId, CancellationToken ct = default)
    {
        var batch = await repository.GetForVerificationAsync(batchId, ct)
            ?? throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลรวม");

        if (batch.Status == PaymentStatus.Succeeded)
        {
            var existingReceipt = string.IsNullOrWhiteSpace(batch.ReceiptPdfUrl)
                ? await receiptService.IssueAndNotifyAsync(batch, ct)
                : batch.ReceiptPdfUrl;
            return new PaymentBatchSlipVerificationResponse(batch.Id, true, batch.SlipAmount, batch.SlipTransRef, existingReceipt);
        }
        if (batch.Method != "transfer")
            throw new PaymentValidationException("INVALID_METHOD", "บิลนี้ไม่ได้ใช้การโอนเงิน");
        if (string.IsNullOrWhiteSpace(batch.SlipUrl))
            throw new PaymentValidationException("SLIP_NOT_FOUND", "บิลนี้ยังไม่มีสลิป");

        var result = await verificationProvider.VerifyAsync(batch.SlipUrl, batch.Amount, ct);
        if (result.IsDuplicate)
            throw new PaymentValidationException("DUPLICATE_SLIP", "สลิปนี้ถูกใช้แล้ว");
        if (!result.IsVerified)
            throw new PaymentValidationException("VERIFICATION_UNAVAILABLE", result.Reason);
        if (!result.Amount.HasValue || Math.Abs(result.Amount.Value - batch.Amount) > 0.01m)
            throw new PaymentValidationException("AMOUNT_MISMATCH", "ยอดในสลิปไม่ตรงกับยอดบิลรวม");

        batch.VerifiedAt = DateTime.UtcNow;
        batch.PaidAt = batch.VerifiedAt.Value;
        batch.VerifiedBy = actorId;
        batch.VerificationProvider = result.Provider;
        batch.VerificationPayload = JsonSerializer.Serialize(new { result.Provider, result.Reference, result.Amount });
        batch.SlipAmount = result.Amount;
        batch.SlipTransRef = result.Reference;
        if (!await repository.SaveVerifiedSlipAsync(batch, ct))
            throw new PaymentValidationException("ALREADY_VERIFIED", "บิลรวมนี้ถูกตรวจสอบแล้ว");

        batch.Status = PaymentStatus.Succeeded;
        string? receiptPdfUrl = null;
        try
        {
            receiptPdfUrl = await receiptService.IssueAndNotifyAsync(batch, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Settlement is final even if receipt storage or notification needs a retry.
        }
        return new PaymentBatchSlipVerificationResponse(batch.Id, true, result.Amount, result.Reference, receiptPdfUrl);
    }

    public async Task<PaymentBatchSlipVerificationResponse> ConfirmManuallyAsync(long batchId, int? actorId, CancellationToken ct = default)
    {
        var batch = await repository.GetForVerificationAsync(batchId, ct)
            ?? throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลรวม");
        if (batch.Status != PaymentStatus.Pending)
            throw new PaymentValidationException("ALREADY_VERIFIED", "บิลรวมนี้ไม่ได้อยู่ในสถานะรอตรวจสอบแล้ว");
        if (batch.Method != "transfer")
            throw new PaymentValidationException("INVALID_METHOD", "ยืนยันด้วยตนเองได้เฉพาะรายการโอนเงิน");
        if (string.IsNullOrWhiteSpace(batch.SlipUrl))
            throw new PaymentValidationException("SLIP_NOT_FOUND", "บิลรวมนี้ยังไม่มีสลิป");

        var verifiedAt = DateTime.UtcNow;
        batch.Status = PaymentStatus.Succeeded;
        batch.PaidAt = verifiedAt;
        batch.VerifiedAt = verifiedAt;
        batch.VerifiedBy = actorId;
        batch.VerificationProvider = "manual";
        batch.VerificationPayload = JsonSerializer.Serialize(new
        {
            provider = "manual",
            method = "bank_statement",
            confirmedAmount = batch.Amount,
            verifiedBy = actorId,
            verifiedAt
        });
        batch.SlipAmount = null;
        batch.SlipTransRef = null;

        if (!await repository.SaveVerifiedSlipAsync(batch, ct))
            throw new PaymentValidationException("ALREADY_VERIFIED", "บิลรวมนี้ถูกตรวจสอบแล้ว");

        string? receiptPdfUrl = null;
        try
        {
            receiptPdfUrl = await receiptService.IssueAndNotifyAsync(batch, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Settlement is final even if receipt storage or notification needs a retry.
        }

        return new PaymentBatchSlipVerificationResponse(batch.Id, true, null, null, receiptPdfUrl);
    }

    public async Task<string> IssueReceiptAsync(long batchId, CancellationToken ct = default)
    {
        var batch = await repository.GetForVerificationAsync(batchId, ct)
            ?? throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลรวม");
        if (batch.Status != PaymentStatus.Succeeded)
            throw new PaymentValidationException("PAYMENT_NOT_SETTLED", "ยังออกใบเสร็จไม่ได้จนกว่าจะยืนยันการชำระเงินสำเร็จ");
        return string.IsNullOrWhiteSpace(batch.ReceiptPdfUrl)
            ? await receiptService.IssueAndNotifyAsync(batch, ct)
            : batch.ReceiptPdfUrl;
    }

    private static PaymentBatchResponse ToResponse(PaymentBatch batch, string message) => new(
        "success",
        message,
        new PaymentBatchData(
            batch.Id,
            batch.InvoiceNo,
            batch.Amount,
            batch.Status,
            batch.ReceiptPdfUrl,
            batch.Allocations.Select(allocation => new PaymentBatchAllocationResponse(
                allocation.EnrollmentId,
                allocation.Enrollment.StudentId,
                allocation.Enrollment.Student.FullName,
                allocation.Enrollment.Course.Name,
                allocation.Amount)).ToList(),
            batch.Method,
            batch.GatewayQrUrl,
            batch.CheckoutUrl,
            batch.GatewayExpiresAt,
            batch.InstallmentBank,
            batch.InstallmentTerm));

    private static bool IsOmiseUrl(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps
        && (uri.Host.Equals("omise.co", StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".omise.co", StringComparison.OrdinalIgnoreCase));
}
