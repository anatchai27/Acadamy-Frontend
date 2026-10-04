-- Apply after backing up the target database and confirming current schema.
CREATE TABLE IF NOT EXISTS payment_batches (
    id BIGINT NOT NULL AUTO_INCREMENT,
    institute_id INT NOT NULL,
    invoice_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    paid_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    slip_url VARCHAR(1000) NULL,
    verified_at DATETIME NULL,
    verified_by INT NULL,
    verification_provider VARCHAR(50) NULL,
    verification_payload JSON NULL,
    slip_amount DECIMAL(10,2) NULL,
    slip_trans_ref VARCHAR(255) NULL,
    receipt_pdf_url VARCHAR(1000) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_batches_invoice_no (invoice_no),
    KEY idx_payment_batches_institute_created (institute_id, created_at),
    CONSTRAINT fk_payment_batches_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payment_batch_allocations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_batch_id BIGINT NOT NULL,
    enrollment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    receipt_pdf_url VARCHAR(1000) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_batch_allocations_batch_enrollment (payment_batch_id, enrollment_id),
    KEY idx_payment_batch_allocations_enrollment (enrollment_id),
    CONSTRAINT fk_payment_batch_allocations_batch FOREIGN KEY (payment_batch_id) REFERENCES payment_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_batch_allocations_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE RESTRICT
);
