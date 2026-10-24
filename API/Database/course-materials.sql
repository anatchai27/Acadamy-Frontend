CREATE TABLE IF NOT EXISTS `course_materials` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `institute_id` INT NOT NULL,
    `course_id` INT NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `original_file_name` VARCHAR(255) NOT NULL,
    `content_type` VARCHAR(100) NOT NULL,
    `file_size_bytes` BIGINT NOT NULL,
    `uploaded_by` INT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_course_materials_institute_course` (`institute_id`, `course_id`),
    CONSTRAINT `fk_course_materials_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_course_materials_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE RESTRICT
);