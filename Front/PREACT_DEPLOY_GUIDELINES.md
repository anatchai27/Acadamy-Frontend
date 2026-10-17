# Preact Project Deployment Guide for Vercel

คู่มือฉบับย่อสำหรับ Developer ในการตั้งค่าโปรเจกต์ที่พัฒนาด้วย **Preact (Vite)** เพื่อเตรียมพร้อมสำหรับนำไป Deploy บน [Vercel](https://vercel.com/) (เชื่อมโยงผ่าน GitHub) ตามมาตรฐานโครงสร้างแผงควบคุม Hobby Account

---

## 1. การตรวจสอบและแก้ไขไฟล์โปรเจกต์ (Pre-deployment)

เพื่อให้ระบบ Vercel สามารถ Build โปรเจกต์ Preact ที่สร้างด้วย Vite ได้อย่างถูกต้อง ให้ตรวจสอบไฟล์หลักในเครื่องดังนี้:

### ⚠️ สิ่งสำคัญ: ห้ามใส่ข้อมูลความลับ (Secrets) ลงในโค้ดตรงๆ
สำหรับข้อมูลที่มีความปลอดภัยสูงหรือข้อมูลส่วนตัว ให้ย้ายไปใส่ในระบบ Environment Variables แทนทั้งหมด

### `package.json`
ตรวจสอบให้แน่ใจว่าในส่วนของ `scripts` มีคำสั่ง `build` และ `preview` สำหรับ Vite เรียบร้อยแล้ว:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### `vite.config.ts` หรือ `vite.config.js`
ตั้งค่าให้แน่ใจว่าไม่มีการ Fix พอร์ตหรือโฮสต์ที่อาจส่งผลขัดขวางการทำงานของระบบ Serverless บน Vercel:
```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
});
```

---

## 2. การสร้างและจัดการ Environment Variables (.env)

หากโปรเจกต์มีความจำเป็นต้องดึงข้อมูลผ่าน API หรือเชื่อมต่อกับ Cloud Object Storage (เช่น Cloudflare R2 บัญชีส่วนตัว) ให้ทำตามขั้นตอนต่อไปนี้:

1. สร้างไฟล์ `.env.local` เพื่อใช้ทดสอบภายในเครื่องเครื่องคอมพิวเตอร์ของคุณเอง
2. สำหรับตัวแปรที่จะเรียกใช้งานในฝั่ง Client-side บน Preact (Vite) จะต้องขึ้นต้นคำว่า `VITE_` เสมอ เช่น:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   VITE_STORAGE_BUCKET=your-r2-bucket-name
   ```
3. **ข้อควรระวัง:** ตรวจสอบให้แน่ใจว่าระบุไฟล์ `.env` และ `.env.local` ไว้ในไฟล์ `.gitignore` แล้ว เพื่อป้องกันไม่ให้ข้อมูลส่วนตัวรั่วไหลหลุดขึ้นไปบน GitHub Public Repository

---

## 3. ขั้นตอนการตั้งค่าในหน้า Vercel Dashboard

เมื่อคุณอัปโหลดโค้ดขึ้น Git Provider เรียบร้อยแล้ว ให้เข้ามาทำรายการบน [Vercel](https://vercel.com/) ตามภาพแผงควบคุมหลัก:

1. คลิกที่ปุ่ม **Add New** มุมขวาบน -> เลือก **Project**
2. เลือก Repository ของโปรเจกต์ Preact ที่ต้องการจากรายการ
3. ในหน้าต่าง **Configure Project** ให้ตั้งค่ารายละเอียดโครงสร้างโปรเจกต์ดังนี้:
   * **Framework Preset:** เลือกเป็น `Vite` (ระบบจะทำการตรวจจับให้อัตโนมัติในกรณีส่วนใหญ่)
   * **Root Directory:** ให้ระบุตำแหน่งที่อยู่ไฟล์ `package.json` (โดยปกติจะเป็น `./`)
   * **Build and Output Settings:** ปล่อยค่าเป็น Default (คำสั่งบิวด์คือ `npm run build` และไดเรกทอรีปลายทางคือ `dist`)
4. ในแท็บ **Environment Variables**:
   * นำตัวแปรคีย์และความลับต่างๆ จากไฟล์ `.env.local` มาระบุใส่ในช่องเพื่อติดตั้งลงระบบคลาวด์ทีละตัว (ระบบ Vercel จะช่วยจัดเก็บข้อมูลส่วนตัวเหล่านี้แยกให้อย่างปลอดภัย)
5. ตรวจสอบความถูกต้องทั้งหมดแล้วคลิกปุ่ม **Deploy**

เมื่อกระบวนการบิวด์เสร็จสิ้น คุณจะได้รับลิงก์สิทธิ์โดเมนใช้งานฟรีในรูปแบบต่อท้ายชื่อโปรเจกต์ของคุณ เช่น `your-project.vercel.app` ทันที สามารถนำลิงก์ดังกล่าวไปทดสอบทดลองเรียกใช้งานระบบต่อได้เลย
