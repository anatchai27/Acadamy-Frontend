-- One-time schema update for the institute's uploaded static payment QR image.
-- Back up the database and check whether this column already exists before running.
ALTER TABLE institutes
    ADD COLUMN payment_qr_image_url VARCHAR(1000) NULL;