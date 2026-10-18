# LINE LIFF Integration — Step-by-Step Manual

**อัปเดตล่าสุด:** 2026-08-01  
**โปรเจกต์:** TiwHub Academy (`LineLiff/`)  
**Tech Stack:** Preact + Vite, LINE LIFF v2, .NET 9 API, TiDB MySQL

---

## สารบัญ

1. [ภาพรวม Architecture](#1-ภาพรวม-architecture)
2. [LINE Developers Console — ตั้งค่า LIFF](#2-line-developers-console--ตั้งค่า-liff)
3. [Frontend — LINE LIFF Flow](#3-frontend--line-liff-flow)
4. [Backend API — Parent Endpoints](#4-backend-api--parent-endpoints)
5. [LINE Rich Menu & Webhook](#5-line-rich-menu--webhook)

---

## 1. ภาพรวม Architecture

```
LINE App
  │
  ├── Rich Menu → User กดปุ่ม "ผู้ปกครอง"
  │       │
  │       ▼
  │   LINE LIFF URL: https://tiwhub.app/liff/
  │       │
  │       ▼
  │   LINE LIFF Browser (WebView ใน LINE)
  │       │
  │       ├── 1. liff.init({ liffId: "..." })
  │       │       └── LINE SDK → ได้ ID Token และ profile
  │       │
  │       ├── 2. liff.isLoggedIn() → true
  │       │       └── liff.getProfile() → { userId, displayName, pictureUrl }
  │       │
  │       ├── 3. POST /api/parents/bind-line { idToken, code? }
  │       │       ├── Backend: verify ID Token กับ LINE Verify API
  │       │       ├── Backend: ใช้ sub ที่ verify แล้วหา LINE binding เดิม
  │       │       ├── First-time: redeem school-issued one-time code
  │       │       └── Response: { token, user, children[] }
  │       │
  │       └── 4. localStorage.setItem('parent_token', token)
  │               └── router → /liff/dashboard
  │
  └── LINE Webhook → POST /api/line/webhook (สำหรับ push notification)
```

---

## 2. LINE Developers Console — ตั้งค่า LIFF

### 2.1 ขั้นตอน

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Provider → Channel (Messaging API)
3. ไปที่ **LIFF** tab → กด **Add**

### 2.2 ค่าที่ต้องตั้ง

| Field | Value | หมายเหตุ |
|-------|-------|---------|
| **LIFF App Name** | TiwHub Parent Portal | ชื่อที่แสดงตอน authorize |
| **Size** | Full | ใช้พื้นที่เต็มหน้าจอ |
| **Endpoint URL** | `https://tiwhub.app/liff/` | **ต้องเป็น HTTPS** — โดเมนจริงเท่านั้น |
| **Scopes** | `profile`, `openid`, `email` | `profile` จำเป็นสำหรับ getProfile() |

### 2.3 หลังสร้าง LIFF สำเร็จ

LINE จะให้ **LIFF ID** (ลักษณะ `-2000000000-abc123`) — ค่านี้ต้องใส่ใน `.env`

### 2.4 Whitelist Domain

ไปที่ **Messaging API** tab → **LINE Official Account Features**:
- **Webhook URL**: `https://tiwhub.app/api/line/webhook` (สำหรับรับ event จาก LINE)
- **Allow Webhook**: ON

---

## 3. Frontend — LINE LIFF Flow

### 3.1 Environment Variables

ไฟล์: `LineLiff/.env` (สำหรับ dev) และ `LineLiff/.env.production` (สำหรับ CI build)

```env
VITE_LIFF_ID=-2000000000-abc123
VITE_API_URL=/api
```

### 3.2 LIFF Initialization (`src/services/liff.js`)

```javascript
// 1. โหลด @line/liff SDK → import() แบบ dynamic เพื่อรอให้ bundle พร้อม
// 2. liff.init({ liffId: VITE_LIFF_ID })
// 3. ถ้าไม่ logged in → liff.login() → LINE จะเปิด authorize page
// 4. ถ้า logged in แล้ว → liff.getProfile() → ได้ userId, displayName, pictureUrl
```

**เหตุผลที่ใช้ dynamic import:** LIFF SDK ตัวใหญ่ (~90KB gzipped) — เรา import เฉพาะตอนที่จำเป็น หน้า splash โหลดเร็วขึ้น

### 3.3 State Management (`src/store/LiffContext.jsx`)

ลำดับ state transition:

```
INITIAL → LIFF_INIT_SUCCESS (หรือ ERROR)
              │
              ├── ถ้าไม่ logged in → login()
              │
              └── ถ้า logged in → SET_LIFF_PROFILE
                                      │
                                      ├── POST /api/parents/bind-line
                                      │       ├── SET_PARENT_TOKEN
                                      │       ├── SET_PARENT_USER
                                      │       ├── SET_CHILDREN
                                      │       ├── SET_ACTIVE_CHILD
                                      │       └── router → /liff/dashboard
                                      │
                                      └── /* parentUser มีแล้ว → ไป dashboard เลย */
```

### 3.4 Login Flow (`src/pages/login.jsx`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  liff.init()                                                           │
│      │                                                                 │
│      ▼                                                                 │
│  liff.isLoggedIn() → false?                                           │
│      │                                                                 │
│      ├── YES → liff.login() → LINE App เปิด authorize page            │
│      │           User กด "อนุญาต" → LINE redirect กลับมาที่ LIFF URL   │
│      │           liff.init() รอบ 2 → isLoggedIn() = true              │
│      │                                                                 │
│      └── NO  → liff.getIDToken() + optional profile for display        │
│                  │                                                     │
│                  ▼                                                     │
│           POST /api/parents/bind-line                                  │
│           { idToken } then { idToken, code } if code is required        │
│                  │                                                     │
│                  ▼                                                     │
│           Response: { token, user, children[] }                        │
│                  │                                                     │
│                  ├── localStorage.setItem('parent_token', token)       │
│                  ├── dispatch SET_CHILDREN                             │
│                  └── route('/liff/dashboard')                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 การเรียก API หลัง Login

ทุก API call ใน `parent-service.js` ใช้ `api.js` ซึ่งจะ:
1. อ่าน `parent_token` จาก `localStorage`
2. ใส่ `Authorization: Bearer <token>` ทุก request
3. ถ้า response 401 → token หมดอายุ → ต้อง login ใหม่

---

## 4. Backend API — Parent Endpoints

### 4.1 Endpoints ทั้งหมดที่ LIFF เรียก

| Method | Path | ไฟล์ Backend (ยังต้องสร้าง) | หน้าที่ |
|--------|------|----------------------------|--------|
| POST | `/api/parents/bind-line` | `Controllers/ParentEndpoints.cs` | ผูก LINE userId กับ parent |
| GET | `/api/parents/me/dashboard` | `Controllers/ParentEndpoints.cs` | ข้อมูลรวม dashboard |
| GET | `/api/parents/me/profile` | `Controllers/ParentEndpoints.cs` | ดู profile ผู้ปกครอง |
| PATCH | `/api/parents/me/profile` | `Controllers/ParentEndpoints.cs` | แก้ไข profile |
| GET | `/api/parents/children/{childId}/attendance` | `Controllers/ParentEndpoints.cs` | ดูประวัติเช็คชื่อ |
| GET | `/api/parents/children/{childId}/payments` | `Controllers/ParentEndpoints.cs` | ดูประวัติการเงิน |
| GET | `/api/parents/children/{childId}/scores` | `Controllers/ParentEndpoints.cs` | ดูคะแนนทักษะ |
| GET | `/api/parents/children/{childId}/homework` | `Controllers/ParentEndpoints.cs` | ดูการบ้าน |
| POST | `/api/parents/children/{childId}/leave-requests` | `Controllers/ParentEndpoints.cs` | ส่งคำร้องขอลา |
| POST | `/api/line/webhook` | `Controllers/LineWebhookController.cs` | รับ event จาก LINE |

### 4.2 `POST /api/parents/bind-line` — หัวใจของระบบ

> **Contract ปัจจุบัน:** ส่วนตัวอย่างเก่าที่กล่าวถึง `lineUserId`, `accessToken`, ตาราง `parent_students` หรือการจับคู่ด้วยเบอร์โทรด้านล่างถูกเลิกใช้แล้ว ให้ยึดตัวอย่างใหม่นี้และ [คู่มือ Parent Auth](../../Objective/line-liff-parent-auth.md) เป็นหลัก

```
Request:
{
  "idToken": "eyJhbGciOi...",       // จาก liff.getIDToken()
  "code": "ABCD2345EFGH"             // required for first-time linking
}

Backend Logic:
1. Verify ID Token กับ LINE API:
  POST https://api.line.me/oauth2/v2.1/verify (id_token + client_id)
   → ถ้าไม่ valid → return 401

2. ใช้ `sub` ที่ LINE ยืนยันแล้วค้น binding เดิม:
  → พบ mapping เดิมที่สอดคล้องกัน → login และออก app JWT
  → ไม่พบ → return 404 `LINK_CODE_REQUIRED`

3. First-time binding ตรวจ hash, expiry (5 วัน), institute/parent scope,
  สถานะ unused และ LINE/account conflicts; consume code + bind ใน transaction
  → invalid/expired/used/conflict: fail closed, ไม่แก้ binding และไม่ออก JWT

4. ออก app JWT หลัง login/redeem สำเร็จ และคืน children ที่ได้รับอนุญาต

Response:
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "fullName": "สมชาย", "phone": "0812345678" },
  "children": [
    { "id": 10, "fullName": "เด็กชาย A", "grade": "ป.4", "instituteId": 1 }
  ]
}
```

Staff/Admin ออกรหัสจากการ์ดผู้ปกครองในหน้าโปรไฟล์นักเรียนผ่าน `POST /api/parents/{parentId}/line-link-code`; รหัสแทน bearer credential ให้ส่งส่วนตัวและใช้ครั้งเดียวเท่านั้น ต้อง apply `API/Database/2026-10-18-parent-line-link-codes.sql` ก่อนใช้ API รุ่นนี้

### 4.3 Model ที่เกี่ยวข้องใน Database

ใช้ schema และความสัมพันธ์ Parent/Student/User ที่มีอยู่จริงใน API นี้ ห้ามสร้างตาราง `parent_students` จากตัวอย่างเอกสารรุ่นเก่าเพื่อรองรับ flow นี้โดยไม่ตรวจ schema ปัจจุบันก่อน ตารางใหม่ที่จำเป็นสำหรับการเชื่อมบัญชีคือ `parent_line_link_codes` ตามไฟล์ SQL ด้านบนเท่านั้น โดยเก็บ code hash, institute/parent scope, วันหมดอายุ และสถานะการใช้/เพิกถอน

### 4.4 Security

```csharp
// ParentEndpoints.cs — ตัวอย่าง Middleware
[Authorize(Roles = "parent")]
public static async Task<Result> GetDashboard(
    HttpContext ctx,
    [FromServices] IParentService service)
{
    var parentId = ctx.User.FindFirst("parentId")?.Value;
    // parentId ถูก inject จาก JWT token
    var dashboard = await service.GetDashboard(parentId);
    return Results.Ok(dashboard);
}
```

---

## 5. LINE Rich Menu & Webhook

### 5.1 สร้าง Rich Menu (LINE Developers Console)

ไปที่ **Messaging API** → **Rich Menu** → **Create**

| Setting | Value |
|---------|-------|
| Title | TiwHub Parent Menu |
| Size | Full (2500x1686) |
| Area 1 | **Tap → LIFF URL**: `https://tiwhub.app/liff/` |

พื้นที่ที่เหลือใน Rich Menu สามารถเพิ่ม:
- แจ้งเตือนการเข้าเรียน (push → LIFF attendance)
- ดูยอดค้างชำระ (push → LIFF payments)
- ติดต่อโรงเรียน

### 5.2 LINE Webhook (`POST /api/line/webhook`)

LINE จะส่ง event มาที่ Webhook URL เมื่อมี action จากผู้ใช้:

```json
// LINE Webhook Event — Follow (User  Add Friend)
{
  "events": [{
    "type": "follow",
    "source": { "userId": "U4c8c3e...", "type": "user" },
    "timestamp": 1612345678000
  }]
}

// LINE Webhook Event — Unfollow (User Unfriend)
{
  "events": [{
    "type": "unfollow",
    "source": { "userId": "U4c8c3e..." },
    "timestamp": 1612345678000
  }]
}

// LINE Webhook Event — Postback (User กดปุ่มใน Rich Menu)
{
  "events": [{
    "type": "postback",
    "source": { "userId": "U4c8c3e..." },
    "postback": { "data": "action=attendance&childId=10" }
  }]
}
```

### 5.3 Controller ตัวอย่าง (Backend)

```csharp
// Controllers/LineWebhookController.cs
[AllowAnonymous]
[HttpPost("api/line/webhook")]
public async Task<IActionResult> HandleWebhook(
    [FromBody] LineWebhookRequest request)
{
    foreach (var evt in request.Events)
    {
        switch (evt.Type)
        {
            case "follow":
                // User เพิ่มเพื่อน LINE Official Account
                // ห้ามใช้ webhook profile เป็นหลักฐานผูก parent; binding ทำผ่าน ID Token + school code ใน LIFF
                await _lineService.HandleFollow(evt.Source.UserId);
                break;

            case "unfollow":
                // User ลบเพื่อน → ลบข้อมูลผูก line
                await _lineService.HandleUnfollow(evt.Source.UserId);
                break;

            case "postback":
                // User กดปุ่มใน Rich Menu
                await _lineService.HandlePostback(
                    evt.Source.UserId, evt.Postback.Data);
                break;
        }
    }

    return Ok(new { });
}
```

### 5.4 การ Push Notification จาก Backend ไป LINE

```csharp
// เมื่อมี event ที่ต้องแจ้ง parent (เช่น เช็คชื่อแล้ว)
public async Task NotifyAttendance(
    string lineUserId, Student student, AttendanceStatus status)
{
    var message = new TextMessage(
        $"📌 {student.FullName} ถูกเช็คชื่อแล้ว\n" +
        $"สถานะ: {GetStatusThai(status)}\n" +
        $"ดูรายละเอียด: https://tiwhub.app/liff/attendance/{student.Id}"
    );

    await _lineMessagingApi.PushMessage(lineUserId, message);
}
```

---

## 6. การ Debug & ข้อควรระวัง

### 6.1 LIFF Debug บน LINE App

- ใช้ **LINE LIFF Browser** (WebView) — dev tools ไม่สามารถ inspect ได้โดยตรง
- วิธี debug: เพิ่ม logging → `console.log()` → ใช้ LINE LIFF API `liff.scanCode()` หรือ `liff.shareTargetPicker()` สำหรับทดสอบ
- LINE มี **LIFF Inspector** บน LINE Developers Console → **LIFF** tab → กด **Preview** เพื่อทดสอบ LIFF URL

### 6.2 ข้อจำกัดที่สำคัญ

| ข้อจำกัด | รายละเอียด |
|---------|-----------|
| **HTTPS Only** | LIFF URL **ต้องเป็น HTTPS** — localhost, HTTP ใช้ไม่ได้ |
| **No OAuth Redirect** | LINE LIFF ใช้ WebView **ไม่ใช้ OAuth redirect** — ต่างจาก Google/Facebook Login |
| **Session 30 วัน** | `parent_token` ควรมีอายุสูงสุด 30 วัน — ถ้าหมด ต้องเข้า LIFF ใหม่ |
| **No Iframe** | LIFF URL ห้าม embed ใน iframe — ต้องเปิดใน LINE WebView โดยตรง |
| **CORS** | Backend ต้อง allow origin ของ production domain |
| **iOS Quirks** | iOS WebView ไม่ support localStorage ข้าม session → ใช้ liff.getIDToken() แทนได้ |

### 6.3 Environment Checklist

ก่อน deploy ไป production:

```
✅ LINE Developers Console:
   - LIFF app สร้างแล้ว → ได้ LIFF ID
   - Endpoint URL = https://tiwhub.app/liff/
   - Scope = profile, openid
   - Webhook URL = https://tiwhub.app/api/line/webhook

✅ Frontend LineLiff:
   - .env.production: VITE_LIFF_ID = ค่าจริง
   - .env.production: VITE_API_URL = /api
   - npm run build → dist/ assets ทั้งหมด path ขึ้นต้น /liff/

✅ Backend API:
  - POST /api/parents/bind-line (verify ID Token; school code required for first-time binding)
   - GET /api/parents/me/dashboard
   - GET /api/parents/children/{id}/attendance
   - GET /api/parents/children/{id}/payments

✅ Deploy:
   - GitHub Actions: build + deploy LineLiff/dist → /var/www/my-app/liff/
   - Nginx: location /liff/ → alias /var/www/my-app/liff/
   - Nginx: location /api/ → proxy_pass localhost:5000

✅ Database:
  - ใช้ Parent/Student/User schema ปัจจุบันของ API
  - Apply API/Database/2026-10-18-parent-line-link-codes.sql ก่อน deploy API รุ่นที่รองรับรหัส
```

---

## 7. สรุป Flow ตั้งแต่ต้นจนจบ

```
1. LINE Admin สร้าง LIFF App → ได้ LIFF ID
2. ใส่ LIFF ID ใน LineLiff/.env.production
3. LINE Admin ตั้งค่า Rich Menu → ลิงก์ไป https://tiwhub.app/liff/
4. LINE Admin ตั้งค่า Webhook → https://tiwhub.app/api/line/webhook
5. Backend Dev สร้าง ParentEndpoints.cs และ LineWebhookController.cs
6. Frontend Dev เขียน LIFF pages (dashboard, attendance, payments, profile)
7. Deploy → GitHub Actions build ทั้งหมด → rsync ไป VPS
8. Nginx serve /liff/ → พาไป static files ของ LIFF
9. User กด Rich Menu → LINE WebView → liff.init() → login → bind → dashboard
```

---

**เอกสารนี้จัดทำโดย Tech Lead — สำหรับทีมพัฒนา TiwHub Academy**