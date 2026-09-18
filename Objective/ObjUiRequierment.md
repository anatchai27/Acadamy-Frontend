📱 TiwHub LINE LIFF Architecture (Part 1 Deep-Dive)

Target Audience: ผู้ปกครอง (Parents) และ นักเรียน (Students)
Platform: LINE LIFF (Mini App ภายในแอป LINE)
Core Concept: Zero-Password, Zero-Friction (ไม่ต้องโหลดแอป ไม่ต้องจำรหัสผ่าน)

👥 1. Role Management (การแบ่ง Role และจัดการสิทธิ์ใน LIFF)

ระบบ LIFF จะไม่มีการให้ผู้ใช้มากดเลือก Role เอง (เพื่อลดความสับสน) แต่ระบบจะจัดการสิทธิ์ให้ "อัตโนมัติ" ผ่านกระบวนการหลังบ้าน ดังนี้:

The Binding Process (การผูกบัญชีครั้งแรก):
เมื่อผู้ใช้กด Rich Menu เข้ามาครั้งแรก ระบบจะอ่าน line_user_id และให้กรอก "เบอร์โทรศัพท์"

ถ้าเบอร์โทรตรงกับตาราง parents -> ระบบจะ Assign Role เป็น "ผู้ปกครอง" ทันที

ถ้าเบอร์โทรตรงกับตาราง students -> ระบบจะ Assign Role เป็น "นักเรียน" ทันที

Parent Role (สิทธิ์ผู้ปกครอง):
สามารถทำได้ทุก Transaction (แจ้งลา, จ่ายเงิน, ดูเกรดลูก)

Multi-Child Support: หากเบอร์โทรผู้ปกครองผูกกับเด็ก 2 คน ระบบจะมีปุ่ม "Child Switcher" ที่ Header ให้กดสลับหน้าโปรไฟล์ลูกได้ทันทีโดยไม่ต้อง Logout

Student Role (สิทธิ์นักเรียน):
เน้นทำ Transaction ของตัวเอง (โชว์ QR Code, ส่งการบ้าน, ดูเกรดตัวเอง) แต่ ไม่มีสิทธิ์ กดแจ้งลา หรือดูเมนูการชำระเงิน

⚙️ 2. หน้าจัดการข้อมูลพื้นฐาน (Master Menus)

เมนูเหล่านี้คือหน้าจอสำหรับตั้งค่า (Setup) หรือดูข้อมูลส่วนตัวที่ไม่ค่อยมีการเปลี่ยนแปลงบ่อยๆ:

My Profile (โปรไฟล์ของฉัน):

แสดงข้อมูลชื่อ, เบอร์โทรศัพท์ และสถานะการผูกบัญชี LINE

แก้ไขรูปภาพโปรไฟล์ (Avatar)

Child Profile (ประวัตินักเรียน) เฉพาะผู้ปกครอง:

แสดงข้อมูลพื้นฐานของลูก, โรงเรียนที่กำลังศึกษา (FR-STD-01)

แสดงข้อมูล แพ้ยา/โรคประจำตัว (medical_info) เพื่อให้ผู้ปกครองตรวจสอบความถูกต้อง (FR-STD-04)

รายชื่อบุคคลที่ได้รับอนุญาตให้มารับกลับบ้าน (FR-STD-05)

PDPA Consent Center (ศูนย์จัดการสิทธิ์ความเป็นส่วนตัว):

หน้าจอสำหรับกดยินยอม/ถอนความยินยอม นโยบายความเป็นส่วนตัวและสิทธิ์การใช้รูปถ่าย (NFR-C-01, NFR-C-04)

ปุ่ม "ขอ Export ข้อมูล (Data Portability)" และ "ขอลบข้อมูล (Right to be Forgotten)" (NFR-C-02, NFR-C-03)

🔄 3. หน้าทำรายการและความเคลื่อนไหว (Transaction Menus)

เมนูเหล่านี้คือหัวใจหลักที่ผู้ปกครองและนักเรียนต้องกดเข้ามาดูเป็นประจำทุกสัปดาห์ (Daily/Weekly Usage):

1. 📊 หน้า Dashboard & Timeline (ภาพรวมรายวัน)

โควต้าคงเหลือ (Session Remaining): แถบ Progress Bar แสดงจำนวนครั้งที่เรียนได้ หากเหลือน้อยกว่า 3 ครั้ง จะขึ้นสีเตือน (FR-PAY-04)

Activity Timeline: Feed แจ้งเตือนแบบ Real-time เช่น "เข้าเรียนแล้วเวลา 08:00 น.", "การบ้านใหม่: คณิตบทที่ 2"

Streak Counter: ตัวเลขโชว์จำนวนวันที่มาเรียนตรงเวลาต่อเนื่อง พร้อมโชว์ Badge ถ้วยรางวัล (FR-SKL-07, FR-SKL-08)

2. 🆔 หน้า QR Digital Pass (บัตรนักเรียนดิจิทัล)

แสดงรูปถ่ายนักเรียน และ QR Code ขนาดใหญ่ตรงกลางจอ (FR-STD-02)

Security UI: ด้านล่าง QR Code จะมีแถบนับเวลาถอยหลัง 60 วินาที (Rotating Token) เพื่อบอกว่า QR นี้จะถูกสุ่มใหม่ ป้องกันการแคปหน้าจอ (NFR-S-07)

3. 🗓️ หน้าแจ้งลาและจองชดเชย (Leave & Make-up)

ปุ่ม "แจ้งลาเรียน": เลือกวันที่, เลือกคาบเรียน, ระบุเหตุผล และปุ่มอัปโหลดรูปภาพใบรับรองแพทย์ (FR-LV-01)

เครดิตชดเชยคงเหลือ: แสดงจำนวน makeup_credits ที่มีสิทธิ์ใช้

ปุ่ม "จองเรียนชดเชย": แสดงปฏิทิน (Slot ว่าง) ที่ครูเปิดรับ ให้ผู้ปกครองกดจิ้มจองที่นั่งได้ทันที (FR-LV-07)

4. 📝 หน้าการบ้าน (Digital Homework)

รายการการบ้าน: แบ่ง Tab ชัดเจนระหว่าง "ค้างส่ง (Pending)" และ "ส่งแล้ว (Submitted)" (FR-HW-06)

หน้ารายละเอียด: แสดงโจทย์, วันกำหนดส่ง (Deadline), ไฟล์แนบจากครู

ปุ่ม "อัปโหลดส่งงาน": เปิดกล้องมือถือถ่ายรูปกระดาษคำตอบ แล้วกดส่งกลับเข้าระบบ (FR-HW-03)

5. 🕷️ หน้าการ์ดพลัง (Skill Card & Radar)

Radar Chart (กราฟใยแมงมุม): ดึงข้อมูล skill_scores มาแสดงเป็นกราฟประเมินทักษะย่อยตามหัวข้อ (FR-SKL-04)

Feedback Inbox: กล่องจดหมายอ่านข้อความคอมเมนต์ (Feedback) จากครูผู้สอนหลังจบบทเรียน (FR-SKL-03)

6. 💳 หน้าการเงิน (Billing & Wallet) เฉพาะผู้ปกครอง

ประวัติชำระเงิน: รายการบิลค่าเรียนทั้งหมด

ปุ่ม "ดาวน์โหลดใบเสร็จ": โหลดไฟล์ PDF ใบเสร็จลงมือถือ (FR-PAY-03)

ปุ่ม "อัปโหลดสลิปโอนเงิน": กรณีที่ต้องโอนเงิน มีหน้าต่างให้อัปโหลดสลิปเพื่อให้ AI หลังบ้านตรวจสอบ (FR-PAY-02)

🖥️ TiwHub Admin Architecture (Part 2 Deep-Dive)

Target Audience: พนักงานเคาน์เตอร์ (Staff) และ ผู้ดูแลระบบ (Admin/Owner)
Platform: Web Application (ใช้งานผ่าน PC, Laptop หรือ Tablet)
Core Concept: ความไวเป็นของปีศาจ, ลดการคลิก/เมาส์, โฟกัสการค้นหา (Search-first)

👥 1. Role Management (การจัดการสิทธิ์ฝั่งแอดมิน)

ตามข้อกำหนด (FR-AUTH-04) ระบบแบ่งสิทธิ์การเข้าถึงหน้าจอหลังบ้านอย่างเคร่งครัด ดังนี้:

Admin (เจ้าของสถาบัน):

มี "Master Key" เข้าถึงได้ทุกหน้าจอ (Master, Transaction, Reports, Settings)

สามารถทำได้ทุกอย่าง รวมถึงการตั้งค่าสถาบัน และลบข้อมูลที่ผิดพลาด (แต่ต้องเป็น Soft Delete และมี Audit Log ตาม NFR-S-04)

Staff (พนักงานเคาน์เตอร์ / ธุรการ / การเงิน):

เข้าถึงหน้า Master Menus (จัดการเด็ก/ผู้ปกครอง) และ Transaction Menus (รับเงิน/เช็คชื่อ)

สิทธิ์ที่ถูกบล็อก: ห้ามเข้าเมนูตั้งค่าระบบ (Settings), ห้ามกดลบประวัติการเงิน (Delete Payment) ทำได้แค่ออกบิลและดูประวัติเท่านั้น

⚙️ 2. หน้าจัดการข้อมูลพื้นฐาน (Master Menus)

เมนูเหล่านี้สำหรับการเพิ่มข้อมูลใหม่เข้าสู่ระบบ หรือแก้ไขประวัติ (Data Entry):

1. 🎓 Directory นักเรียนและผู้ปกครอง (Student & Parent Management)

หน้า List View: ตารางแสดงรายชื่อนักเรียนทั้งหมด มีช่อง Search ใหญ่ๆ ให้พิมพ์ชื่อ, รหัส, หรือเบอร์พ่อแม่ (FR-STD-06) พร้อมปุ่ม Export Excel (FR-STD-07)

ฟอร์มเพิ่มนักเรียน (Dynamic Form):

อัปโหลดรูป, กรอกชื่อ, โรงเรียน, ระดับชั้น (FR-STD-01)

Medical Alert Section: กล่อง Textarea สีแดงให้กรอกโรคประจำตัว/แพ้อาหาร (FR-STD-04)

Dynamic Parent Array: ปุ่ม [+ เพิ่มผู้ปกครอง] กดเพิ่มได้ไม่จำกัด (พ่อ, แม่, คนขับรถ) พร้อมช่องระบุเบอร์โทรและ "ผู้มีสิทธิ์รับกลับ" (FR-STD-03, 05)

Auto-Generate: เมื่อกด Save ระบบสร้าง QR Code ให้เด็กทันที (FR-STD-02)

2. 👨‍🏫 Directory ครูผู้สอน (Teacher Management)

เพิ่มรายชื่อครู, ประวัติย่อ, วิชาที่สอน

ระบุ "เรทค่าสอนต่อชั่วโมง (Hourly Rate)" เพื่อนำไปคำนวณ Payroll ตอนสิ้นเดือน (FR-RPT-06, FR-OPS-04)

3. 📚 Course Catalog (การสร้างคอร์สเรียน Polymorphic)

ฟอร์มสร้างคอร์สเรียนที่เปลี่ยนหน้าตาตาม course_type (Group, Private, Subscription, Video, Credit)

มีช่องให้ระบุ ราคา, จำนวนคาบ (หรือเครดิต), และจำกัดจำนวนคนรับได้ (Capacity Limit)

🔄 3. หน้าปฏิบัติการรายวัน (Transaction Menus)

เมนูเหล่านี้คือหน้าจอที่พนักงานต้องเปิดค้างไว้ตลอดทั้งวัน เพื่อรับมือกับผู้ปกครองและนักเรียน:

1. 💳 หน้าเครื่องคิดเงินและออกใบเสร็จ (High-Speed POS & Billing)

หน้าจอที่ออกแบบมาให้จบการขายได้ไวที่สุด:

ค้นหา & เลือกซื้อ: พิมพ์ชื่อเด็ก -> จิ้มเลือกคอร์สเรียน -> ระบบคำนวณยอดเงินรวม (FR-PAY-01)

ส่วนลด (Discount): ช่องให้พนักงานกรอกส่วนลดพิเศษ หรือโปรโมชัน (FR-PAY-08)

การชำระเงิน: เลือกเงินสด หรือ โอนเงิน (แสดง PromptPay QR ให้สแกน)

Atomic Action: เมื่อกดยืนยันปุ๊บ ระบบจะ:

หุ้ม Transaction บันทึกยอดเงินเข้าบัญชีสถาบัน

บวกโควต้าเรียน (sessions_remaining หรือ wallet balance) ให้เด็กทันที

Generate ไฟล์ PDF ใบเสร็จพร้อมเลข invoice_no อัตโนมัติ (FR-PAY-03)

ยิง LINE ส่งลิงก์ใบเสร็จให้ผู้ปกครองทันที

2. 🚪 หน้าจอกล้องสแกนเช็คชื่อ (QR Attendance Kiosk)

ออกแบบมาให้เปิดค้างไว้ที่หน้าประตูสถาบัน (Tablet/PC + Webcam):

UI โหมดสแกน: หน้าจอมีกรอบสแกน เมื่อเด็กเอา QR Code มาจ่อ (FR-ATT-01)

ความเร็ว 2 วินาที: ระบบต้องประมวลผล ตัดโควต้า และขึ้นหน้าจอเขียวโชว์รูปเด็ก พร้อมเสียงขานชื่อให้จบใน < 2 วินาที (NFR-P-02)

Anti-Double Scan: หากเด็กมือสั่นสแกนเบิ้ล ระบบมี Idempotency Guard บล็อกการหักโควต้าซ้ำ (FR-ATT-07)

Manual Mode: ด้านข้างมีตารางรายชื่อเด็กในคลาสวันนี้ เผื่อเด็กลืมบัตร พนักงานกดจิ้ม "มาเรียน/สาย/ลา" ด้วยเมาส์ได้เลย (FR-ATT-05)

3. 📬 กล่องข้อความตรวจสลิปโอนเงิน (AI Slip Inbox)

หน้าต่าง Inbox คล้ายอีเมล แต่เป็นสลิปโอนเงินที่ผู้ปกครองส่งเข้ามาผ่าน LINE

ระบบ AI จะช่วยไฮไลท์ยอดเงิน และเช็คว่าเลขสลิปซ้ำหรือไม่ (FR-PAY-02)

พนักงานตรวจสอบด้วยตาอีกครั้ง แล้วกดปุ่ม [✅ ยืนยันยอด] ระบบจะวิ่งไปเติมโควต้าให้เด็กอัตโนมัติ

4. 🗓️ ระบบอนุมัติการลาและจองห้อง (Request & Room Management)

หน้าจอแจ้งเตือนเมื่อผู้ปกครองกดยื่นใบลาเข้ามา พนักงาน/ครูกด [อนุมัติ] เพื่อให้ระบบแจกคูปอง Make-up Credit อัตโนมัติ

ตารางการจัดห้องเรียน (Room Booking) ดูภาพรวมว่าห้องไหนว่าง/ไม่ว่าง ป้องกันการจัดตารางสอนชนกัน (FR-OPS-02)
👨‍🏫 TiwHub Teacher Architecture (Part 3 Deep-Dive)

Target Audience: ครูผู้สอน (Teachers)
Platform: Web Application (ออกแบบเป็น Tablet/Mobile First)
Core Concept: เน้นการปัด (Swipe), กดจิ้ม (Tap) ลดการพิมพ์ให้มากที่สุด เพราะครูต้องใช้ระหว่างอยู่ในห้องเรียน

👥 1. Role Management (การจัดการสิทธิ์ฝั่งคุณครู)

ตามเอกสาร SRS (FR-AUTH-04) ระบบแบ่งสิทธิ์ของคุณครูไว้เพื่อความปลอดภัยและลดความสับสนดังนี้:

สิทธิ์ที่ทำได้ (Access Granted):

เข้าถึงหน้าตารางสอนของตัวเองเท่านั้น (ดูคลาสเรียนและรายชื่อเด็กในห้อง)

เช็คชื่อ, ให้คะแนน (Skill Card), สั่งการบ้าน, และเปิดคลาสชดเชย

สิทธิ์ที่ถูกบล็อก (Access Denied):

ห้ามเข้าถึงเมนูการเงิน (Payment) เด็ดขาด มองไม่เห็นยอดเงินของสถาบันหรือของเด็ก

ห้ามเข้าถึงเมนูตั้งค่าระบบ (Settings) หรือแก้ไขฐานข้อมูลหลักของโรงเรียน

⚙️ 2. หน้าจัดการข้อมูล (Master Menus)

เมนูเหล่านี้สำหรับการเตรียมความพร้อมก่อนเข้าสอน:

1. 📂 Class Material Library (คลังเอกสารการสอน)

คลังไฟล์ (File Storage): หน้าจอสำหรับให้ครูอัปโหลดไฟล์ PDF, ใบงาน, หรือสไลด์การสอน ไปเก็บไว้บน Cloud (FR-OPS-03) เพื่อดึงไปแนบตอนสั่งการบ้านให้เด็กได้ง่ายๆ

2. 🎯 Skill Topics Setup (ตั้งค่าหัวข้อบทเรียน)

จัดการหัวข้อ: ก่อนเปิดคอร์ส ครูสามารถเข้ามาสร้าง "หัวข้อบทเรียน" ของวิชาตัวเองได้ (เช่น บทที่ 1: ตรรกศาสตร์, บทที่ 2: เซต) เพื่อเอาไปใช้ให้คะแนนในการ์ดพลังทีหลัง (FR-SKL-01)

🔄 3. หน้าปฏิบัติการรายวัน (Transaction Menus)

เมนูเหล่านี้คือหน้าจอที่ครูต้องเปิดใช้ทุกวัน ทั้งก่อนสอน ระหว่างสอน และหลังสอน:

1. 🗓️ My Schedule & Attendance (ตารางสอน & เช็คชื่อ)

หน้าตารางสอน (Calendar View): แสดงคลาสเรียนที่ครูต้องสอนในวันนี้

กล้องสแกน QR: เมื่อกดเข้าคลาส จะมีปุ่มเปิดกล้องมือถือ/แท็บเล็ตให้ครูสแกน QR เด็กเพื่อเช็คเข้าเรียน (FR-ATT-01)

Manual Attendance (สมุดเช็คชื่อดิจิทัล): กรณีเด็กลืมบัตร หน้าจอจะแสดงรายชื่อเด็กทั้งหมดในห้อง ให้ครูกดจิ้มปุ่มเปลี่ยนสถานะ (มาเรียน / สาย / ขาด) ได้ด้วยมือ (FR-ATT-05)

บันทึกการลาแทนผู้ปกครอง: หากผู้ปกครองไลน์มาบอกครูส่วนตัว ครูสามารถกดปุ่ม "บันทึกการลา" แทนผู้ปกครองในหน้านี้ได้เลย (FR-LV-02)

2. 🕷️ Fast Grading & Skill Card (การ์ดพลัง)

หน้าให้คะแนนรายคลาส: เมื่อสอนจบบทเรียน หน้าจอจะโชว์รายชื่อเด็กเรียงกัน

Slider / Tap UI: ครูสามารถเลื่อนแถบเปอร์เซ็นต์ (0-100%) เพื่อประเมินความเข้าใจของเด็กในบทนั้นๆ (FR-SKL-02)

Feedback Box: กล่องสำหรับพิมพ์คอมเมนต์สั้นๆ ถึงเด็กแต่ละคน (FR-SKL-03) (แนะนำให้มีปุ่มไมโครโฟน เพื่อใช้เสียงพิมพ์แทน (Voice-to-Text) จะช่วยครูประหยัดเวลามาก)

3. 📝 Homework Room (ห้องสั่งและตรวจการบ้าน)

ปุ่มสั่งการบ้าน (Assign): ครูสามารถกดสั่งการบ้าน พิมพ์คำสั่ง แนบไฟล์ใบงานจากคลังเอกสาร และกำหนดวัน-เวลาส่ง (Deadline) (FR-HW-01)

ตารางตรวจงาน (Review Dashboard): แสดงรายชื่อเด็กที่ "ส่งแล้ว" และ "ค้างส่ง" ชัดเจน (FR-HW-06)

โหมดตรวจงาน: เมื่อกดที่ชื่อเด็ก ระบบจะเปิดรูปการบ้านที่เด็กอัปโหลดขึ้นมา ครูสามารถกดให้คะแนน และพิมพ์ Feedback ส่งกลับไปให้เด็กและผู้ปกครองดูได้ (FR-HW-04)

4. 🛋️ Make-up Slot Management (จัดการคลาสชดเชย)

เปิดห้องสำรอง: กรณีครูมีเวลาว่าง สามารถกด "เปิด Slot ชดเชย" โดยระบุ วัน, เวลา, และ "จำนวนที่นั่งที่รับได้ (Capacity)" (FR-LV-06) เพื่อให้ระบบเอาไปโชว์ใน LINE ให้ผู้ปกครองกดจอง

Group Cancel: หากครูป่วยกะทันหัน สามารถกดปุ่ม "ยกเลิกคลาส (Group Cancel)" ระบบจะทำการคืนเครดิต (Make-up Credit) กลับให้เด็กทุกคนในคลาสอัตโนมัติ (FR-LV-08)

📊 TiwHub Owner Architecture (Part 4 Deep-Dive)

Target Audience: เจ้าของสถาบัน (Institute Owner) และ ผู้ดูแลระบบ (Super Admin)
Platform: Web Application (ใช้งานผ่าน PC หรือ Laptop เพื่อดู Dashboard ขนาดใหญ่)
Core Concept: Data-Driven Decision (ดูตัวเลขแล้วตัดสินใจได้เลย) และ Centralized Control (ศูนย์กลางการตั้งค่า)

👥 1. Role Management (สิทธิ์ขาดของผู้บริหาร)

ตามเอกสาร SRS (1.4 และ FR-AUTH-04) สิทธิ์ของ Admin คือ "จุดสูงสุด" ของระบบ:

สิทธิ์ที่ทำได้ (Super Power):

God Mode: เข้าถึงได้ทุกเมนู ทุกหน้าจอ (รวมถึงหน้าของ Staff และ Teacher)

Manage Roles: สามารถเพิ่มบัญชีพนักงานและกำหนดสิทธิ์ให้เป็น Staff หรือ Teacher ได้

Financial & Reports: เป็น Role เดียวที่มองเห็น "รายงานรายได้ทั้งหมด" และ "สถิติของสถาบัน"

Data Control: สามารถกด Export ข้อมูล (Excel/CSV) สำหรับบัญชีและการยื่นภาษี (FR-PAY-07)

⚙️ 2. หน้าจัดการตั้งค่าและระบบ (Master & Setup Menus)

เมนูเหล่านี้สำหรับการตั้งค่าทิศทางและกฎเกณฑ์ของโรงเรียน (ทำครั้งเดียว หรือนานๆ อัปเดตที):

1. 📅 Holiday & Calendar Settings (ตั้งค่าวันหยุด)

Holiday Calendar: แอดมินสามารถกำหนด "วันหยุดประจำปี" หรือ "วันหยุดพิเศษ" ของสถาบัน ระบบจะรับรู้และไม่นับครั้งเรียน หรือไม่ฟ้องขาดเรียนในวันดังกล่าว (FR-OPS-01)

2. 🌐 Website CMS (ระบบจัดการหน้าเว็บสาธารณะ)

แก้ไขหน้าบ้าน: แอดมินสามารถกดเปลี่ยนรูป แบนเนอร์ หรืออัปเดตผลงานเด็ก/ประวัติครู บนหน้าเว็บไซต์สาธารณะได้เองโดยไม่ต้องเขียนโค้ด (FR-WEB-06)

3. ⚖️ Compliance & Security (กฎหมายและความปลอดภัย)

PDPA Management: หน้าจอดูแลคำขอจัดการสิทธิ์ เช่น ถ้าผู้ปกครอง "ขอลบข้อมูลลูก (Right to be Forgotten)" แอดมินมากดจัดการให้ที่หน้านี้ รวมถึงดู Consent Log (FR-OPS-05, NFR-C-02, NFR-C-04)

System Backup: จุดตรวจสอบการสำรองข้อมูล (Backup) ว่าระบบทำงานเก็บข้อมูลรายวันครบถ้วนไหม (FR-OPS-06)

🔄 3. หน้าจัดการการเงินหลังบ้านและทรัพยากร (Operations & Resources)

เมนูเหล่านี้สำหรับการดูแลความเรียบร้อยหลังบ้าน ที่พนักงานเคาน์เตอร์ปกติเข้าไม่ถึง:

1. 🏫 Room Booking (การจัดตารางและห้องเรียน)

Room Allocation Board: หน้าจอดูภาพรวมตารางสอนทั้งหมด ระบบมี AI/Logic ตรวจสอบเพื่อ "ป้องกันการจัดห้องเรียนชนกัน" (FR-OPS-02)

2. 💸 Teacher Payroll (ระบบคำนวณค่าตอบแทนครู)

Timesheet & Payroll: ระบบจะดึง "ชั่วโมงที่ครูสอนจริง" ไปคูณกับ "เรทค่าสอน (Hourly Rate)" แล้วสรุปออกมาเป็นยอดเงินเดือน/ค่าสอนให้ครูแต่ละคนอัตโนมัติ (FR-OPS-04, FR-RPT-06)

📈 4. หน้ารายงานและวิเคราะห์ธุรกิจ (Executive Reports & Analytics)

นี่คือ "หัวใจ" ของ Part 4 (อิงจากหมวด 3.10) หน้าต่าง Dashboard สำหรับวิเคราะห์ธุรกิจ:

1. 📊 Daily Executive Dashboard (ภาพรวมรายวัน)

หน้าจอสรุปตัวเลขแบบ Real-time: วันนี้เด็กมาเรียนกี่คน, ขาดกี่คน, และ "รายได้วันนี้" (FR-RPT-01)

2. 🚨 Retention & Risk (วิเคราะห์ความเสี่ยงลูกค้า)

Churn Risk Report: ระบบเตือนรายชื่อนักเรียนที่ "เสี่ยงจะเลิกเรียน" (เช่น ขาดเรียนบ่อย หรือโควต้าหมดแล้วยังไม่ซื้อต่อ) เพื่อให้ทีมงานรีบโทรตาม (FR-RPT-02)

Renewal Rate: กราฟแสดงอัตราการต่อคอร์สของนักเรียนเก่า (FR-RPT-03)

3. 🎯 Marketing & Sales Analytics (วิเคราะห์การตลาด)

Trial Conversion: สรุปตัวเลขว่า เด็กที่มา "ทดลองเรียนฟรี" เปลี่ยนเป็นจ่ายเงินสมัครเรียนกี่เปอร์เซ็นต์ (FR-RPT-04)

Referral Tracking: ดูว่าเด็กคนไหน "ชวนเพื่อนมาเรียน" เยอะที่สุด เพื่อทำแคมเปญแจกรางวัล (FR-RPT-07)

NPS Survey: ดูคะแนนความพึงพอใจรายไตรมาสที่ส่งให้ผู้ปกครองประเมิน (FR-OPS-07)

4. 🔮 Revenue Forecast (พยากรณ์รายได้)

ระบบคำนวณคาดการณ์รายได้ของเดือนถัดไป (Forecast) โดยอิงจากคอร์สของนักเรียนที่กำลังจะหมดอายุและถึงกำหนดต้องชำระใหม่ (FR-RPT-05)

🌐 TiwHub Public Website Architecture (Part 5 Deep-Dive)

Target Audience: ผู้ปกครองและนักเรียนทั่วไป (Prospects) และ เจ้าของสถาบัน (Admin/Owner)
Platform: Web Application (Responsive รองรับ PC, Tablet, Mobile)
Core Concept: First Impression (สร้างความน่าเชื่อถือ), SEO-Friendly (กูเกิลหาเจอ), และ Conversion (เปลี่ยนคนเข้าเว็บเป็นลูกค้า)

👥 1. Role Management (การเข้าถึง)

เว็บไซต์หน้าบ้านเป็น "พื้นที่สาธารณะ" จึงไม่มีการแบ่ง Role แบบล็อกอินเพื่อเข้าดูเนื้อหา แต่มีการแบ่งการใช้งานดังนี้:

Public Users (ผู้ปกครอง/นักเรียนทั่วไป):

ดูข้อมูลได้ทุกหน้า (ผลงาน, ประวัติครู, ตารางคอร์ส)

กรอกฟอร์ม "ทดลองเรียน" หรือส่งข้อความติดต่อสถาบัน

Admin / Institute Owner (สิทธิ์เจ้าของสถาบัน):

เข้าผ่าน "หลังบ้าน (Admin Panel)" เพื่อแก้ไขเนื้อหา (CMS - Content Management System) ที่จะไปโชว์อยู่หน้าบ้าน

⚙️ 2. หน้าแสดงผลสาธารณะ (Public Views)

หน้าเหล่านี้คือส่วนที่บุคคลภายนอกมองเห็น ถูกออกแบบมาเพื่อให้ข้อมูลและโน้มน้าวใจ (อิงตามหมวด 3.8):

1. 🏠 หน้าแรก (Homepage & Landing Page)

Hero Banner: ภาพสไลด์เด่นๆ แจ้งโปรโมชัน หรือกิจกรรมล่าสุด (FR-WEB-01)

Why Choose Us: จุดเด่นของสถาบัน (เช่น มีระบบดูผลการเรียนผ่าน LINE, ครูจบตรงสาย)

Quick CTAs (Call to Action): ปุ่มขนาดใหญ่ "ดูตารางคอร์ส" หรือ "สมัครทดลองเรียนฟรี"

2. 🏆 หน้าผลงานความสำเร็จ (Student Achievements)

Hall of Fame: แกลเลอรีภาพความสำเร็จของนักเรียน (เช่น ภาพเด็กสอบติด, ภาพรับรางวัล) (FR-WEB-02)

Admin Role: แอดมินสามารถอัปโหลดรูปและพิมพ์คำบรรยายสั้นๆ ได้จากหลังบ้าน

3. 👨‍🏫 หน้าทำเนียบครูผู้สอน (Teacher Directory)

Teacher Profiles: รูปถ่ายคุณครู, ประวัติการศึกษา, ประสบการณ์สอน และรายวิชาที่เชี่ยวชาญ (FR-WEB-03)

Auto-sync: ข้อมูลดึงมาจากตาราง teachers (ประวัติและรูป) ทำให้แอดมินไม่ต้องพิมพ์ข้อมูลซ้ำซ้อน

4. 📚 หน้าตารางคอร์สและราคา (Course Catalog)

Course Listing: แสดงรายการคอร์สเรียนทั้งหมดที่สถาบันเปิดสอน (FR-WEB-04)

Filter & Search: ผู้ปกครองสามารถกดกรองดูตาม "ระดับชั้น" (เช่น ป.4-ป.6) หรือ "วิชา" (เช่น คณิตศาสตร์, ภาษาอังกฤษ)

Auto-sync: ข้อมูลดึงมาจากตาราง courses โดยอัตโนมัติ (ดึงเฉพาะคอร์สที่สถานะเป็น 'Published')

5. 📞 หน้าติดต่อเรา (Contact Us)

Location & Info: แผนที่ Google Maps, เบอร์โทร, เวลาทำการ (FR-WEB-05)

Quick Connect: ปุ่มแอด LINE Official Account (เชื่อมไปสู่ระบบ LIFF ในอนาคต)

🔄 3. หน้าทำรายการและหาลูกค้า (Acquisition Transactions)

ฟีเจอร์เหล่านี้เน้นการ "จับลูกค้า" ให้ติดมือ ก่อนที่เขาจะปิดเว็บหนี:

1. 🎯 ฟอร์มลงทะเบียนทดลองเรียน (Trial Class Booking)

Lead Capture Form: ฟอร์มสั้นๆ ให้กรอก (ชื่อ, เบอร์โทร, ระดับชั้น, วิชาที่สนใจ) (FR-WEB-08)

Instant Alert: เมื่อมีคนกด Submit ระบบจะบันทึกข้อมูลเป็น "Lead" เข้าระบบหลังบ้าน และแจ้งเตือนแอดมินผ่าน LINE ทันที เพื่อให้พนักงานรีบโทรกลับ

2. 🤖 ระบบ SEO (Search Engine Optimization)

Google Discoverability: โครงสร้างเว็บไซต์ต้องเขียนแบบ SSR (Server-Side Rendering) หรือ SSG (Static Site Generation) เพื่อให้บอทของ Google เข้ามาอ่านเนื้อหา (ชื่อคอร์ส, ชื่อครู) และนำไปจัดอันดับในหน้าค้นหาได้ง่าย (FR-WEB-07, NFR-P-01)

🎨 TiwHub Frontend Work Breakdown (Admin, LINE LIFF, CMS)

Author: System Analyst (Zero-Trust Architecture Lead)
Target: Frontend Engineering Lead, Frontend Developers
Tech Stack: Preact + Vite + Tailwind CSS v4 + React Router
Context: อ้างอิงจากแผนการทำงาน Sprint ปัจจุบัน (เน้นปิด P0/P1 ของ Admin, LIFF และเตรียม CMS)

🎯 1. Admin Panel (ระบบจัดการข้อมูลหลังบ้าน)

เป้าหมาย: สร้าง UI ที่ "ความไวเป็นของปีศาจ" ลดการใช้เมาส์ เน้น Search-first และจัดการข้อมูล (CRUD) ได้อย่างรวดเร็ว โดยคำนึงถึง institute_id (Tenant) เสมอ

🚀 [Epic 1] Student & Parent Management (การจัดการนักเรียนและผู้ปกครอง)

[FE-ADM-01] [P0] Refactor Student Registration Form (Dynamic Parents & Medical Info) (4.0 hrs)

Detail: ปรับปรุงหน้า student-add-page.jsx

Action: เพิ่ม Field medical_info (Textarea สีแดงเตือนภัย) และสร้าง Component DynamicParentList ให้กดปุ่ม [+ เพิ่มผู้ปกครอง] เพื่อรับข้อมูลผู้ปกครองคนที่ 1, 2, 3 ได้เรื่อยๆ แบบ Array

[FE-ADM-02] [P1] Build Student ID Card PDF Export (CR80 Standard) (3.5 hrs)

Detail: สร้าง Component หรือฟังก์ชันในหน้า student-profile-page.jsx

Action: ใช้ Library (เช่น react-pdf หรือสร้าง HTML Template ส่งให้ Backend) เพื่อเรนเดอร์บัตรนักเรียนขนาด CR80 พร้อมแสดง QR Code และรูปโปรไฟล์ เพื่อให้พนักงานกดสั่งพิมพ์ได้

[FE-ADM-03] [P1] Implement Data Export Buttons (CSV/Excel) (2.0 hrs)

Detail: อัปเดตหน้า students-page.jsx

Action: เพิ่มปุ่ม Export Data ใช้ Library xlsx หรือรับ Blob จาก Backend API เพื่อดาวน์โหลดรายชื่อนักเรียนและประวัติการเงิน

🚀 [Epic 2] Financial Operations (ระบบการเงินและ POS)

[FE-ADM-04] [P0] Refactor POS Billing Interface (High-Speed Checkout) (5.0 hrs)

Detail: ปรับปรุงหน้า finance-page.jsx

Action: สร้าง UI แบ่งครึ่งจอ (Split Screen). ซ้าย: Search Bar ขนาดใหญ่หาชื่อเด็ก -> เลือกคอร์ส. ขวา: สรุปยอด (Cart), ช่องใส่ส่วนลด (discount_amount), เลือกวิธีชำระเงิน. กดปุ่ม ชำระเงิน (เรียก API /api/payments)

[FE-ADM-05] [P0] Implement Receipt PDF Download Action (2.0 hrs)

Detail: ต่อเนื่องจากการจ่ายเงิน

Action: เมื่อ API /api/payments ตอบกลับสำเร็จ (200 OK พร้อม slip_url หรือ invoice_no), ให้แสดง Modal หรือเปิด New Tab เพื่อโหลด PDF ใบเสร็จที่ Backend สร้างไว้ (QuestPDF)

[FE-ADM-06] [P1] Build Slip Upload & AI Verification Loading State (3.0 hrs)

Detail: สำหรับการจ่ายด้วยโอนเงิน

Action: สร้างกล่อง Upload สลิป, ใส่ Skeleton/Spinner Loading ระหว่างรอ API 3rd-party (EasySlip) ตรวจสอบความถูกต้อง, และโชว์ผลลัพธ์ (เขียว=ผ่าน, แดง=สลิปซ้ำ)

🚀 [Epic 3] Flexible Course Builder (ระบบสร้างคอร์สแบบ Polymorphic)

[FE-ADM-07] [P0] Build State-Driven Course Creation Form (4.5 hrs)

Detail: ปรับปรุงหน้าเพิ่มคอร์สเรียน

Action: สร้าง Dropdown เลือก course_type (Group, Private, Subscription, Video, Credit) และใช้ State (e.g., useState) เพื่อทำ Conditional Rendering. ตัวอย่าง: ถ้าเลือก Subscription ให้โชว์ช่อง expires_in_days และซ่อนช่อง total_sessions.

📱 2. LINE LIFF App (ประสบการณ์ดิจิทัลของผู้ปกครองและนักเรียน)

เป้าหมาย: "Zero-Friction Access" โหลดไว ไม่ต้องใช้รหัสผ่าน ใช้งานผ่าน LINE ได้ทันที

🚀 [Epic 4] Parent Portal (หน้าปัดผู้ปกครอง)

[FE-LIF-01] [P0] Build Leave Request Form (แจ้งลาเรียน) (4.0 hrs)

Detail: สร้างหน้า /liff/leave-request

Action: ฟอร์มเลือก "ชื่อลูก" (กรณีมีหลายคน) -> เลือก "คอร์ส/คาบเรียน" -> เลือก "เหตุผล" -> ปุ่ม Upload ใบรับรองแพทย์ -> เรียก API POST /api/parents/children/{childId}/leave-requests

[FE-LIF-02] [P0] Integrate Real Class Schedule in Dashboard (3.0 hrs)

Detail: ปรับปรุงหน้า Dashboard ของ LIFF

Action: เลิกใช้ Mock Data. เรียก API ดึงข้อมูล sessions (ตารางสอน) ของเด็กมาแสดงเป็น Timeline Card ให้เห็นว่าวันนี้/สัปดาห์นี้มีเรียนวิชาอะไร ห้องไหน

[FE-LIF-03] [P1] Build Make-up Slot Booking UI (ปฏิทินจองชดเชย) (4.5 hrs)

Detail: สร้างหน้า /liff/makeup-booking

Action: แสดงโควต้า makeup_credits คงเหลือ -> แสดง Calendar/List ของ makeup_slots ที่เปิดว่าง -> กดจิ้มจองที่นั่ง (ต้องทำ Loading State กันคนกดเบิ้ล)

[FE-LIF-04] [P1] Build Multi-Child Switcher Component (2.5 hrs)

Detail: Header ของ LIFF App

Action: สร้าง Dropdown Menu ให้ผู้ปกครองกดสลับ student_id เพื่อเปลี่ยน Context ของหน้าจอไปดูข้อมูลของลูกอีกคนได้โดยไม่ต้องรีเฟรชแอป

🚀 [Epic 5] Academic & Gamification (วิชาการและการ์ดพลัง)

[FE-LIF-05] [P1] Build Skill Card Radar Chart (กราฟพัฒนาการ) (3.5 hrs)

Detail: สร้างหน้า /liff/scores/:childId

Action: ใช้ Recharts หรือ Chart.js วาดกราฟใยแมงมุม (Radar Chart) จากข้อมูล skill_scores พร้อมแสดง List ของคอมเมนต์ (Feedback) จากครู

[FE-LIF-06] [P1] Build Digital Homework Submission UI (4.0 hrs)

Detail: สร้างหน้า /liff/homework/:childId

Action: แสดง List การบ้าน (แบ่ง Tab: ค้างส่ง/ส่งแล้ว). ในหน้าส่งงาน ต้องมีปุ่มเปิดกล้อง/อัปโหลดรูปภาพ (Image Compression ก่อนส่ง) -> ส่ง API POST /api/homework-submissions

🌐 3. Public CMS (ระบบจัดการเนื้อหาเว็บไซต์หน้าบ้าน)

เป้าหมาย: ให้เจ้าของสถาบันอัปเดตหน้าเว็บได้เองโดยไม่ต้องยุ่งกับโค้ด (CMS Backend) และหน้าเว็บที่รองรับ SEO

🚀 [Epic 6] Website Content Management (Admin Panel ฝั่ง CMS)

[FE-CMS-01] [P1] Build Website Settings & Banner Management UI (4.0 hrs)

Detail: สร้างเมนูใหม่ Website CMS ใน Admin Panel

Action: ฟอร์มสำหรับจัดการ Hero Banner (อัปโหลดรูป, เปลี่ยนข้อความ), แก้ไข Contact Info, และจัดการรูปภาพ Hall of Fame (ผลงานนักเรียน) โดยบันทึกเข้าตารางตั้งค่าระบบหรือ JSON

[FE-CMS-02] [P1] Build Public Course Catalog Toggle (2.0 hrs)

Detail: ในหน้าจัดการคอร์สเรียน (Admin Panel)

Action: เพิ่ม Switch Toggle Publish to Website (เปลี่ยนสถานะ courses.status เป็น 'published') เพื่อให้ API หน้าบ้านดึงไปโชว์ได้

[FE-CMS-03] [P2] Build Lead/Trial Booking Kanban Board (3.5 hrs)

Detail: สร้างหน้าสำหรับดูข้อมูลลูกค้าใหม่

Action: UI แบบ Kanban Board ดึงข้อมูลจาก API Lead/Trial Booking เพื่อให้พนักงานลากเปลี่ยนสถานะ (New -> Contacted -> Trial -> Enrolled)

📋 คำแนะนำเพิ่มเติมสำหรับ Frontend Team (Tailwind v4 & Preact)

State Management: งานที่มีความซับซ้อนสูงอย่าง "เครื่องคิดเงิน (POS)" หรือ "สร้างคอร์ส Polymorphic" แนะนำให้ใช้ State Management Tools (เช่น Zustand หรือ Context API) เพื่อป้องกัน Prop Drilling

UI Components: ใช้ประโยชน์จาก Tailwind v4 ในการทำ Utility-first styling ให้ไวที่สุด ถ้าใช้ shadcn-ui (หรือ Radix UI) มาช่วยทำพวก Dropdown, Modal, DatePicker จะลดเวลาไปได้เยอะมาก

Loading States (UX): ทุกครั้งที่ยิง API (โดยเฉพาะเรื่องเงินและการลา) ต้อง มี Loading Spinner หรือ Disable ปุ่มเสมอ เพื่อป้องกันปัญหา Double-tap Race Condition จากฝั่ง Client
🎨 TiwHub Frontend Detailed Specs (เจาะลึกระดับ Component)

Stack: Preact + Vite + Tailwind CSS v4 + React Router
Target: Frontend Developers
Concept: "คุยภาษาบ้านๆ แต่สเปคทำงานได้จริง"

🖥️ 1. เจาะลึก Admin Panel (ระบบหน้าเคาน์เตอร์ และหลังบ้าน)

เป้าหมายหลัก (UX Goal): พนักงานเคาน์เตอร์ต้องทำงานไวที่สุด ลดการใช้เมาส์ เน้น Search หาเจอทันที

1.1 หน้าฟอร์มลงทะเบียนนักเรียน (Student Registration Form)

หน้าจอนี้ไม่ใช่ฟอร์มธรรมดา แต่ต้องมีความ "ยืดหยุ่น (Dynamic)" สูงมาก

UI Layout: แบ่งเป็น 3 ส่วนหลัก (ประวัติเด็ก, ข้อมูลสุขภาพ, ข้อมูลผู้ปกครอง)

จุดที่ต้องเน้น (Component Details):

Medical Alert Box: ช่องกรอกโรคประจำตัว/แพ้อาหาร ให้ใช้ textarea หุ้มด้วยกรอบสีแดงอ่อน (Tailwind: border-red-500 bg-red-50) เพื่อให้พนักงานรู้ว่านี่คือจุดคอขาดบาดตาย

Dynamic Parents Array:

ตั้งต้นด้วยฟอร์มผู้ปกครอง 1 คน (พ่อ หรือ แม่)

มีปุ่ม [+ เพิ่มผู้ปกครอง] (Tailwind: btn-outline-dashed)

เมื่อกดปุ่ม ให้ useState ที่เป็น Array งอกฟอร์มคนที่ 2, 3 ออกมา

มีช่อง Checkbox ถามว่า "ผู้ปกครองคนนี้มีสิทธิ์รับเด็กกลับบ้านไหม?"

Auto-Save & QR: พอกด "บันทึก" สำเร็จ หน้าต่าง Modal ต้องเด้งขึ้นมาโชว์ QR Code ประจำตัวเด็กทันที (ใช้ Lib react-qr-code) พร้อมปุ่มดาวน์โหลดรูปภาพ

1.2 หน้าเครื่องคิดเงิน (POS & Billing Split-Screen)

นี่คือหน้าจอทำเงินของสถาบัน ต้องออกแบบให้เหมือนหน้าจอสั่งอาหาร

UI Layout: แบ่งครึ่งจอ (Split Screen: ซ้าย 60% ขวา 40%)

จุดที่ต้องเน้น (Component Details):

ฝั่งซ้าย (ค้นหา & เลือกของ):

แถบค้นหาใหญ่ยักษ์ พิมพ์ปุ๊บ Auto-complete รายชื่อเด็กเด้งปั๊บ (Debounce 300ms ป้องกัน API โหลดหนัก)

เมื่อเลือกเด็กเสร็จ ด้านล่างจะโชว์ Card คอร์สเรียนต่างๆ ให้กดจิ้มใส่ตะกร้า

ฝั่งขวา (สรุปบิล & จ่ายเงิน):

แสดงรายการในตะกร้า (Cart)

มีช่อง input เล็กๆ ให้กรอก "ส่วนลด (Discount)" (พิมพ์ปุ๊บ ยอด Total หักลบแบบ Real-time)

ปุ่มเลือกวิธีจ่ายเงิน (โอน / เงินสด / บัตร)

จังหวะชี้เป็นชี้ตาย: ถ้าเลือก "โอนเงิน" ให้โชว์ QR Code PromptPay ขึ้นมา พร้อมกล่องให้พนักงานอัปโหลดรูปสลิป

ใบเสร็จ PDF: จ่ายเสร็จปุ๊บ เด้ง Modal โชว์ไฟล์ PDF (ที่ได้ URL มาจาก Backend) พร้อมปุ่ม "Print"

1.3 หน้าสร้างคอร์สเรียน (Polymorphic Course Builder)

UI Layout: ฟอร์มสร้างคอร์สแบบ State-Driven (เปลี่ยนหน้าตาตามสิ่งที่เลือก)

จุดที่ต้องเน้น (Component Details):

เริ่มต้นด้วย Dropdown ให้เลือกประเภทคอร์ส (course_type)

ถ้าเลือก Group: โชว์ฟิลด์ จำนวนคาบ (Session) และ Dropdown เลือกครูผู้สอน

ถ้าเลือก Private: ซ่อน จำนวนคาบ (ไปกรอกตอนขาย) ซ่อน ครูผู้สอน

ถ้าเลือก Subscription: โชว์ช่อง วันหมดอายุ (เช่น 30 วัน, 90 วัน)

ถ้าเลือก Credit Wallet: โชว์ช่อง แต้มที่ใช้ต่อ 1 คาบ

ข้อควรระวัง: เวลา User สลับ Dropdown ไปมา ต้อง reset ค่าใน state ของฟิลด์ที่ถูกซ่อนทิ้งไป เพื่อไม่ให้ส่งข้อมูลขยะไปหา Backend

📱 2. เจาะลึก LINE LIFF App (หน้าปัดผู้ปกครองและนักเรียน)

เป้าหมายหลัก (UX Goal): แม่บ้าน/ผู้สูงอายุต้องกดง่าย ปุ่มใหญ่ ใช้นิ้วโป้งกดมือเดียวสะดวก (Zero-Friction)

2.1 Header & Multi-Child Switcher (ตัวสลับข้อมูลลูก)

UI Layout: แถบบนสุดของมือถือ (Sticky Header)

จุดที่ต้องเน้น (Component Details):

ถ้าแม่มีลูก 1 คน: โชว์รูปและชื่อลูกปกติ

ถ้าแม่มีลูก > 1 คน: ตรงชื่อลูกต้องมีไอคอน Dropdown 🔽

กดปุ๊บ มี Bottom Sheet เลื่อนขึ้นมาให้จิ้มสลับเป็นข้อมูล "น้อง A" หรือ "น้อง B"

Liff State: เมื่อกดสลับลูก Context/Zustand State ต้องดึง childId ใหม่ และ Trigger ให้ Component ข้างล่าง (Dashboard, โควต้า) รีโหลดข้อมูลใหม่แบบเนียนๆ โดยไม่ต้องโหลดหน้าเว็บใหม่

2.2 หน้าฟอร์มแจ้งลาป่วย / ลากิจ (Leave Request Form)

UI Layout: หน้าฟอร์มแบบ Step-by-step

จุดที่ต้องเน้น (Component Details):

เลือกวิชาที่จะลา: ดึงตารางเรียนมาเป็น Card ให้จิ้มเลือก (ห้ามให้แม่พิมพ์ชื่อวิชาเองเด็ดขาด ป้องกันการพิมพ์ผิด)

ปุ่มถ่ายรูปใบรับรองแพทย์: แตะปุ๊บเปิด Camera API ของมือถือถ่ายได้เลย

Image Compression: สำคัญมาก! ก่อนยิง API รูปไปหา Backend ฝั่ง Frontend ต้องบีบอัดรูป (ใช้ Lib พวก browser-image-compression) ให้เหลือขนาด < 2MB เพื่อลดภาระเน็ต 4G ของผู้ปกครอง

Loading State: พอกด "ส่งคำขอ" ต้องมีปุ่มหมุนติ้วๆ (Loading Spinner) และ disabled ปุ่มไว้ ป้องกันแม่ใจร้อนกดเบิ้ล 2 ที!

2.3 การ์ดพลังและพัฒนการ (Radar Chart Skill Card)

UI Layout: กราฟสวยงาม ดูไฮเทค

จุดที่ต้องเน้น (Component Details):

ใช้ Library Recharts (หรือ Chart.js) วาด RadarChart

ดึง Data skill_scores จาก API มาแปลงเป็นเปอร์เซ็นต์ (0-100) ตามหัวข้อ (เช่น ทักษะการคิด, ทักษะการพูด)

ด้านล่างกราฟ เป็นกล่องข้อความ (Inbox) โชว์ Feedback หรือคอมเมนต์ที่ครูพิมพ์ชมเด็ก

2.4 หน้าส่งการบ้านออนไลน์ (Digital Homework)

UI Layout: แบ่ง Tab (งานค้างส่ง / ส่งแล้ว)

จุดที่ต้องเน้น (Component Details):

แสดงโจทย์การบ้านเป็น Card มีป้ายสีแดงเขียนว่า "ส่งภายในวันพรุ่งนี้ (Due date)"

มีปุ่ม [เปิดกล้องส่งงาน] หน้าตาเหมือนปุ่มส่งไลน์

ใช้หลักการบีบอัดรูป (Image Compression) เหมือนฟอร์มลาป่วยเป๊ะ

🌐 3. เจาะลึก Public Website & CMS (ระบบหน้าบ้านหาลูกค้า)

เป้าหมายหลัก (UX Goal): สวยงาม น่าเชื่อถือ แอดมินต้องแก้ข้อความเองได้ง่ายเหมือนพิมพ์ Word

3.1 Website Settings & Banners (หลังบ้าน CMS)

UI Layout: หน้าจอ Settings ทั่วไป

จุดที่ต้องเน้น (Component Details):

Hero Banner Upload: มีกล่องสี่เหลี่ยมเส้นประ (Drag & Drop) ให้แอดมินลากรูปโปรโมชันมาวาง

Image Preview: อัปโหลดเสร็จ ต้องโชว์พรีวิวรูปให้ดูก่อนกด Save

มีฟอร์มแก้ข้อความ เบอร์โทรศัพท์ และพิกัด Google Maps ให้ไปโชว์ที่หน้า "ติดต่อเรา (Contact Us)"

3.2 ปุ่มเปิด/ปิด คอร์สเรียนหน้าบ้าน (Public Course Toggle)

UI Layout: ในหน้าจัดการคอร์สของ Admin

จุดที่ต้องเน้น (Component Details):

เพิ่มปุ่ม Switch (Toggle) สวยๆ พิมพ์ว่า "แสดงบนเว็บไซต์หน้าบ้าน"

เมื่อกดปุ่ม (onChange) -> ยิง API PUT /api/courses/{id}/publish ทันที (Optimistic UI: เปลี่ยนสีปุ่มเป็นสีเขียวก่อน ถ้ายิง API พังค่อยเด้งกลับเป็นสีเทาและขึ้น Error Toast)

3.3 กระดานติดตามลูกค้าใหม่ (Lead Kanban Board)

UI Layout: เป็นกระดานคล้าย Trello

จุดที่ต้องเน้น (Component Details):

สร้างคอลัมน์ 4 ช่อง: ลูกค้าใหม่ (New) -> ติดต่อแล้ว (Contacted) -> มาทดลองเรียน (Trial) -> สมัครเรียนจริง (Enrolled)

ใช้ Library เบาๆ เช่น @dnd-kit/core

เมื่อพนักงานเอาเมาส์คลิกการ์ดชื่อลูกค้าลากไปช่องถัดไป (Drag & Drop) -> ส่ง API ไปอัปเดต Status ลูกค้าคนนั้นทันที

---

## ✅ TODO Card: UI Requirement MVP Backlog

**เป้าหมาย:** เปลี่ยน Requirement ชุดนี้ให้เป็นรายการงาน UI ที่เริ่มทำได้จริง โดยเริ่มจากเส้นทางใช้งานหลักก่อน ไม่ทำทุกหน้าพร้อมกัน

**สถานะเริ่มต้น:** `[ ]`

- [ ] ยืนยันผู้ใช้งานกลุ่มแรกของ MVP: Staff, Teacher, Parent/Student หรือ Owner
- [ ] เลือก User Journey หลักที่ต้องใช้งานได้ก่อน 1-2 เส้นทาง เช่น รับชำระเงิน, เช็คชื่อ หรือผู้ปกครองแจ้งลา
- [ ] ทำตาราง Screen Inventory ระบุหน้าจอ, Role, API ที่ใช้, สถานะ Loading/Empty/Error และสิทธิ์การเข้าถึง
- [ ] ตรวจว่าแต่ละหน้าจอมี API และข้อมูลจริงรองรับแล้ว ห้ามใช้ Mock Data เป็นแหล่งข้อมูลหลัก
- [ ] แตกงานเป็น Frontend Task Card รายหน้า พร้อมระบุ Priority, ไฟล์ที่ต้องแก้ และ Acceptance Criteria
- [ ] ทำ Design/Component ที่ใช้ซ้ำก่อน เช่น Layout, Header, Role Guard, Search, Table, Form, Modal, Toast และ Loading State
- [ ] พัฒนา MVP ของ User Journey ที่เลือกให้จบตั้งแต่เปิดหน้า, เรียก API, บันทึกข้อมูล จนแสดงผลสำเร็จ
- [ ] รองรับกรณีผิดพลาดที่ผู้ใช้เจอจริง เช่น API ล่ม, ข้อมูลว่าง, สิทธิ์ไม่ถึง, กดปุ่มซ้ำ และหมดอายุ Session
- [ ] ทดสอบ Responsive บน Mobile, Tablet และ Desktop ตาม Platform ของแต่ละ Role
- [ ] ทดสอบ Acceptance Criteria กับข้อมูลจริงใน Test Environment และบันทึก Gap ที่ยังไม่ปิด

**Definition of Done:** User Journey ที่เลือกทำงานได้จริงด้วยข้อมูลจาก API, มี Loading/Empty/Error State, ผ่าน Role/Tenant Check และผ่านการทดสอบบนหน้าจอเป้าหมาย
