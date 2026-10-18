-- One-time school-issued LINE parent linking codes.
-- Apply to TiDB/MySQL before deploying the API version that uses this table.
-- Do not store the raw redeemable code; only its SHA-256 hash is persisted.

CREATE TABLE IF NOT EXISTS `parent_line_link_codes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `parent_id` INT NOT NULL,
    `institute_id` INT NOT NULL,
    `created_by_user_id` INT NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `redeemed_at` DATETIME(6) NULL,
    `redeemed_by_line_user_id` VARCHAR(255) NULL,
    `revoked_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_parent_line_link_codes_code_hash` (`code_hash`),
    KEY `ix_parent_line_link_codes_parent_state` (`parent_id`, `redeemed_at`, `revoked_at`),
    KEY `ix_parent_line_link_codes_institute_expiry` (`institute_id`, `expires_at`),
    CONSTRAINT `fk_parent_line_link_codes_parent`
        FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_parent_line_link_codes_institute`
        FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
