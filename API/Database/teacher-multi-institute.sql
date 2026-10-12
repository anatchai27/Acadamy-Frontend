-- Run once against the production database after taking a backup.
-- Allows the same teacher login to have one institute-specific teacher profile per institute.
-- User IDs remain globally unique for teacher accounts; no student or user rows are changed.

ALTER TABLE `teachers`
    DROP INDEX `IX_teachers_user_id`;

CREATE UNIQUE INDEX `IX_teachers_user_id_institute_id`
    ON `teachers` (`user_id`, `institute_id`);
