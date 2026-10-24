-- Records who uploaded the latest file for a homework submission.
-- Apply once before deploying the API build that maps these columns.
ALTER TABLE `homework_submissions`
    ADD COLUMN `submitted_by_user_id` INT NULL,
    ADD COLUMN `submitted_by_role` VARCHAR(20) NULL;
