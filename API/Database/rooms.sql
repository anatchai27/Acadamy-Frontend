CREATE TABLE IF NOT EXISTS rooms (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  institute_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_rooms_institute FOREIGN KEY (institute_id) REFERENCES institutes(id),
  UNIQUE KEY uq_rooms_institute_name (institute_id, name),
  KEY ix_rooms_institute (institute_id)
);
