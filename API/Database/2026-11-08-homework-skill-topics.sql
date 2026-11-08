-- Add the homework-to-skill mapping table used by GET/PUT /api/homeworks/{id}/skill-topics.
-- Apply to the target MySQL database before or alongside deploying the API.
-- CREATE TABLE IF NOT EXISTS makes this safe to re-run when the table already exists.
CREATE TABLE IF NOT EXISTS `homework_skill_topics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `institute_id` INT NOT NULL,
    `homework_id` INT NOT NULL,
    `topic_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_homework_skill_topics_institute_homework_topic` (`institute_id`, `homework_id`, `topic_id`),
    KEY `idx_homework_skill_topics_homework_id` (`homework_id`),
    KEY `idx_homework_skill_topics_topic_id` (`topic_id`),
    CONSTRAINT `fk_homework_skill_topics_institute`
        FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_homework_skill_topics_homework`
        FOREIGN KEY (`homework_id`) REFERENCES `homeworks` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_homework_skill_topics_topic`
        FOREIGN KEY (`topic_id`) REFERENCES `skill_topics` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
