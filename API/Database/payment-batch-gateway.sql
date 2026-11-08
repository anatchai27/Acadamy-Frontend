-- Apply once after backing up the target database and confirming the payment_batches schema.
-- Omise secret keys stay in API environment configuration; never put them in this table or frontend.
ALTER TABLE payment_batches
    ADD COLUMN gateway_ref_id VARCHAR(255) NULL,
    ADD COLUMN gateway_qr_url VARCHAR(1000) NULL,
    ADD COLUMN checkout_url VARCHAR(1000) NULL,
    ADD COLUMN gateway_expires_at DATETIME NULL,
    ADD COLUMN installment_bank VARCHAR(50) NULL,
    ADD COLUMN installment_term INT NULL,
    ADD UNIQUE KEY uq_payment_batches_gateway_ref (gateway_ref_id);