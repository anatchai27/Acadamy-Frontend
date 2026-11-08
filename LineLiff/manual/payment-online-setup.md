# การเปิดใช้ QR PromptPay และผ่อนบัตรเครดิตใน LINE LIFF

## สิ่งที่ระบบทำ

- **โอนเงิน:** ใช้บัญชีของสถาบันและแนบสลิปเหมือนเดิม
- **PromptPay:** API สร้าง QR จาก Omise โดยผูกกับยอดและเลขอ้างอิงของบิล; LIFF ขอให้ API ตรวจสถานะจาก charge ก่อนเปลี่ยนเป็นชำระสำเร็จ
- **ผ่อนบัตร:** API สร้าง Omise installment source และ charge แล้วส่งผู้ปกครองไปหน้า authorize ของ Omise; ระบบนี้ไม่รับหรือเก็บเลขบัตร/CVV
- **ใบเสร็จ:** ออกได้เมื่อ API ตรวจพบ charge เป็น `successful` และชำระแล้วเท่านั้น

## ก่อนเปิดใช้จริง

1. ใช้บัญชี Omise กลางของผู้รับเงินและตรวจสอบ merchant/KYC กับผู้ให้บริการให้เรียบร้อย
2. ขอเปิดใช้ Installment Payments กับ Omise และยอมรับข้อกำหนดของบริการก่อนเปิดการตั้งค่า feature
3. ตั้งค่าความลับไว้ใน environment/configuration ของ API เท่านั้น ห้ามใส่ secret key ใน `.env` ของ LineLiff, `VITE_*`, source control หรือ browser bundle:
   - `Omise__SecretKey`
   - `Omise__LiffId` — LIFF ID ที่ใช้สร้าง return URI
   - `Omise__EnableInstallments=true` — เปิดเมื่อ Omise อนุมัติการผ่อนแล้วเท่านั้น
   - `Omise__WebhookSecret` ยังเก็บไว้ฝั่ง API; flow ปัจจุบันตรวจ charge ผ่าน Omise API เมื่อผู้ปกครองกดตรวจสถานะ/กลับจาก checkout
4. รันสคริปต์ schema [payment-batch-gateway.sql](../../API/Database/payment-batch-gateway.sql) กับฐานข้อมูลก่อน deploy API ที่อ่านคอลัมน์ gateway
5. ทดสอบด้วย Omise test keys และทดสอบทุกสถานะ: รอจ่าย, สำเร็จ, ปฏิเสธ, หมดอายุ, network timeout และกลับจากหน้า checkout
6. ตรวจนโยบายค่าธรรมเนียม/ดอกเบี้ยกับฝ่ายบัญชีและ Omise ให้ชัดเจน ระบบให้ลูกค้าตรวจยอดและดอกเบี้ยจริงที่หน้า Omise ก่อนกดยืนยัน ไม่แสดงยอดผ่อนโดยประมาณที่อาจคลาดเคลื่อน

## แผนผ่อนที่แสดง

ตัวเลือกธนาคารและงวดอิงเอกสาร Omise Installment Payments ของประเทศไทย และผ่านการตรวจซ้ำฝั่ง API ตามยอดขั้นต่ำ/งวดที่รองรับ รายการที่แสดงใน LIFF ไม่ได้ยืนยันว่า merchant account ได้รับอนุมัติจากทุกธนาคารแล้ว ผู้ดูแลต้องยืนยันสิทธิ์กับ Omise ก่อนเปิดใช้จริง

## การยืนยันยอด

LIFF ไม่เป็นแหล่งความจริงของสถานะการจ่าย API จะอ่านสถานะ charge จาก Omise และตรวจยอด THB กับเลขอ้างอิงให้ตรงกับบิลก่อนบันทึกสำเร็จ หากสถานะยัง pending ให้กดตรวจอีกครั้งภายหลัง ห้ามส่งสลิปสำหรับ QR หรือบัตรเครดิต
