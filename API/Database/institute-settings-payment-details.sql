-- One-time schema update for admin institute settings and parent transfer instructions.
-- Take a database backup first. Do not run this file more than once.
ALTER TABLE institutes
    ADD COLUMN email VARCHAR(255) NULL,
    ADD COLUMN address VARCHAR(1000) NULL,
    ADD COLUMN tax_id VARCHAR(50) NULL,
    ADD COLUMN receipt_note VARCHAR(2000) NULL,
    ADD COLUMN bank_name VARCHAR(120) NULL,
    ADD COLUMN bank_account_name VARCHAR(255) NULL,
    ADD COLUMN bank_account_number VARCHAR(50) NULL,
    ADD COLUMN promptpay_id VARCHAR(50) NULL,
    ADD COLUMN payment_instructions VARCHAR(1000) NULL;
