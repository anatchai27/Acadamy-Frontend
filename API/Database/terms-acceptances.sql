-- Versioned Terms of Service acceptance audit log.
-- Apply before deploying the API version that maps TermsAcceptance.
-- Preserve rows as append-only history; each user can have one row per document version.

CREATE TABLE IF NOT EXISTS `terms_acceptances` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `parent_id` INT NULL,
    `document_type` VARCHAR(40) NOT NULL DEFAULT 'terms',
    `document_version` VARCHAR(50) NOT NULL,
    `language` VARCHAR(5) NOT NULL DEFAULT 'th',
    `content_sha256` CHAR(64) NOT NULL,
    `accepted_at` DATETIME(6) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `source` VARCHAR(50) NOT NULL,
    `actor_type` VARCHAR(50) NOT NULL DEFAULT 'user',
    `actor_id` INT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_terms_acceptances_user_document_version` (`user_id`, `document_type`, `document_version`),
    KEY `ix_terms_acceptances_accepted_at` (`accepted_at`),
    KEY `ix_terms_acceptances_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;