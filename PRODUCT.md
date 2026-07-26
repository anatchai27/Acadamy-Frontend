# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**สถาบันกวดวิชา (Admin)** — จัดการข้อมูลสถาบัน, ครูผู้สอน, นักเรียน, คอร์สเรียน, การเงิน, และระบบทั้งหมด
**ครูผู้สอน** — จัดการคาบเรียน, เช็คชื่อ, ให้คะแนนการบ้าน, ประเมินทักษะ, ดูข้อมูลนักเรียน

## Product Purpose

TiwHub Academy เป็นระบบจัดการสถาบันกวดวิชาแบบ all-in-one ที่ช่วยให้สถาบันขนาดเล็กถึงกลางจัดการข้อมูลที่ยุ่งยากให้ใช้งานง่ายและสะดวก ลดภาระงานเอกสารและเพิ่มประสิทธิภาพการบริหารจัดการ

## Positioning

ระบบที่ออกแบบมาเพื่อสถาบันกวดวิชาไทยโดยเฉพาะ — รองรับภาษาไทยเต็มรูปแบบ, ใช้ LINE ID เป็นช่องทางติดต่อหลัก, จัดการข้อมูลนักเรียน-ครู-คอร์ส-การเงินในที่เดียว, ทำงานบน VPS ราคาประหยัด (1GB RAM)

## Operating Context

- Web application ทำงานบน browser (Chrome, Safari บนมือถือ)
- Deploy บน Ubuntu 24.04 VPS (RAM 1GB + Swap 2GB)
- Frontend: Preact + Vite + Tailwind CSS v4, static files serviced by Nginx
- Backend: .NET 9 Web API, systemd service, reverse proxy โดย Nginx (/api/ → port 5000)
- Database: TiDB Cloud (MySQL-compatible)
- File storage: Alibaba Cloud OSS (รูปนักเรียน, ครู, สลิป)
- Authentication: JWT token-based
- Admin login via email/password
- Student/Parent access via token-based portal (planned)
- LINE Messaging API สำหรับ notification (planned)

## Capabilities and Constraints

### Capabilities
- จัดการนักเรียน: เพิ่ม/แก้ไข/ค้นหา/ดูโปรไฟล์ พร้อมรูปถ่ายและข้อมูลผู้ปกครอง
- จัดการครูผู้สอน: เพิ่ม/แก้ไข/ลบ พร้อมรูปถ่าย
- จัดการคอร์สเรียน: สร้างคอร์ส, จัดการคาบเรียน, ดูรายชื่อนักเรียน
- เช็คชื่อ: สแกน QR Code และเช็คชื่อด้วยมือ
- ระบบวิชาการ: สั่งการบ้าน, ให้คะแนน, ประเมินทักษะ
- ระบบการเงิน: บันทึกรายรับ, ดูประวัติการเงิน
- ระบบสินค้า: จัดการสินค้า/บริการ
- ระบบผู้ใช้: จัดการบทบาท (admin, teacher, staff)
- ระบบคำร้องขอ: อนุมัติ/ปฏิเสธ
- ระบบตั้งค่า: จัดการข้อมูลสถาบัน
- Dual theme: Bento (modern) และ Neobrutalism (playful)
- Achievement badges สำหรับ Admin
- Mobile responsive (bottom nav, horizontal scroll, dvh units)

### Constraints
- VPS RAM 1GB — build ต้องทำบน GitHub Actions, ไม่ใช่บน VPS
- รองรับเฉพาะภาษาไทย (ฟอนต์ Sarabun)
- Parent notification ยังไม่ implement (ต้องต่อ LINE Messaging API)
- Student portal ยังไม่ implement (ต้องสร้าง frontend + API)
- ไม่มีระบบ OTP หรือ LINE Login

## Brand Commitments

- ชื่อ: TiwHub Academy
- ฟอนต์: Sarabun (Google Fonts, รองรับภาษาไทย)
- โลโก้: รูปสี่เหลี่ยมที่มีตัวอักษร TH
- Design tokens: Oasis palette (primary #2563eb, accent #06b6d4)
- ภาษา: ไทยทั้งหมด
- รองรับ 2 design themes: Bento (soft, rounded) และ Neobrutalism (bold, black borders, hard shadows)

## Evidence on Hand

- source code ใน `Front/src/` และ `API/`
- ไฟล์ `Front/standard_design.md` — design system documentation
- ไฟล์ `deploy/` — CI/CD configuration
- ไฟล์ `Front/public/changelog.json` — release history

## Product Principles

1. **ลดความซับซ้อน** — ข้อมูลที่ยุ่งยากถูกทำให้ใช้งานง่าย ไม่ต้องใช้เอกสารกระดาษ
2. **Mobile-first** — admin ใช้งานบนมือถือได้จริง รองรับทุกฟีเจอร์ผ่าน bottom navigation
3. **เล่นสนุก** — gamification (badges) และ dual theme สร้างประสบการณ์ที่ไม่น่าเบื่อ
4. **ประหยัดทรัพยากร** — ทุกการตัดสินใจทางเทคนิคคำนึงถึง VPS 1GB RAM
5. **พัฒนาต่อยอดได้** — โค้ดแยกส่วน (modular components) พร้อม design system ชัดเจน

## Accessibility & Inclusion

- ฟอนต์ Sarabun อ่านง่าย รองรับภาษาไทยครบถ้วน
- Badge stickers ใช้ `role="status"` + `aria-live="polite"`
- Theme toggle ใช้ `<button aria-label="เปลี่ยนธีม">`
- สีมี contrast ที่เหมาะสม (Oasis palette)