-- Seed the standard school-supply catalog for every institute.
-- Safe to run more than once: existing institute/product names are skipped.

INSERT INTO products (institute_id, name, price, description, is_active, created_at)
SELECT i.id, 'ปากกาลูกลื่น', 10.00, 'ปากกาสำหรับจดบันทึกและทำแบบฝึกหัด', 1, UTC_TIMESTAMP()
FROM institutes i
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.institute_id = i.id AND p.name = 'ปากกาลูกลื่น'
);

INSERT INTO products (institute_id, name, price, description, is_active, created_at)
SELECT i.id, 'สมุดโน้ต', 35.00, 'สมุดสำหรับจดบทเรียนและการบ้าน', 1, UTC_TIMESTAMP()
FROM institutes i
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.institute_id = i.id AND p.name = 'สมุดโน้ต'
);

INSERT INTO products (institute_id, name, price, description, is_active, created_at)
SELECT i.id, 'ดินสอ', 5.00, 'ดินสอสำหรับเขียนและทำแบบฝึกหัด', 1, UTC_TIMESTAMP()
FROM institutes i
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.institute_id = i.id AND p.name = 'ดินสอ'
);

INSERT INTO products (institute_id, name, price, description, is_active, created_at)
SELECT i.id, 'ยางลบ', 5.00, 'อุปกรณ์เครื่องเขียนสำหรับลบรอยดินสอ', 1, UTC_TIMESTAMP()
FROM institutes i
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.institute_id = i.id AND p.name = 'ยางลบ'
);

INSERT INTO products (institute_id, name, price, description, is_active, created_at)
SELECT i.id, 'ไม้บรรทัด', 15.00, 'อุปกรณ์การเรียนสำหรับวัดและขีดเส้น', 1, UTC_TIMESTAMP()
FROM institutes i
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.institute_id = i.id AND p.name = 'ไม้บรรทัด'
);
