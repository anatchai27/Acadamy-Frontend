# LINE LIFF Parent Authentication and Binding

สถานะเอกสาร: อธิบายพฤติกรรมที่ implement อยู่ในปัจจุบัน และข้อกำหนดด้านความปลอดภัยที่ต้องรักษาเมื่อแก้ flow นี้

## สรุปสั้น

- LIFF ส่ง **LINE ID Token** (`idToken`) ให้ API ไม่ส่ง LINE profile หรือ `lineUserId` ที่ client อ้างเอง
- API ตรวจ ID Token กับ LINE Verify API โดยใช้ `Line:LoginChannelId` แล้วใช้ `sub` ที่ LINE ยืนยันเป็น LINE user ID
- ถ้า LINE ID นี้ผูกกับบัญชีผู้ปกครองแล้ว API ออก JWT ของระบบให้
- การค้นด้วยเบอร์อย่างเดียวไม่ใช่หลักฐานว่าเป็นเจ้าของบัญชี: ในโหมดปกติ API ต้องไม่ผูกบัญชีด้วยเบอร์ล้วน
- `MODE_TEST_AUTH=true` ใช้ได้เฉพาะ local Development/test data เท่านั้น ห้ามเปิดใน production
- ถ้าเบอร์ซ้ำหรือพบ LINE binding ที่ขัดแย้งกัน ให้ปฏิเสธการผูก ห้ามเลือกแถวแรกแบบเงียบ ๆ

## Flow ปัจจุบัน

```mermaid
sequenceDiagram
    participant P as Preact LIFF
    participant A as .NET API
    participant L as LINE Verify API
    participant D as Database
    P->>A: POST /parents/bind-line { idToken, phone? }
    A->>L: Verify id_token + client_id
    L-->>A: verified sub (LINE user ID)
    A->>D: Find parent by verified LINE user ID
    alt LINE already linked to a parent account
        D-->>A: Existing parent/user
        A-->>P: 200 + app JWT + children in account institute
    else No existing LINE link
        A->>D: Find phone matches (only if phone supplied)
        alt Local Development and MODE_TEST_AUTH=true, one safe match
            A->>D: Link verified LINE ID and save
            A-->>P: 200 + app JWT + children
        else Ambiguous, conflicting, or production/non-test phone-only match
            A-->>P: 404 or 409; do not issue JWT or mutate binding
        end
    end
```

### 1. LIFF client

- `LineLiff/src/services/liff.js` obtains the token with `liff.getIDToken()`.
- `LineLiff/src/pages/login.jsx` posts `{ idToken, phone }` to `POST /parents/bind-line`.
- The client must not send a profile-supplied LINE user ID as proof of identity.
- The app JWT is stored as `parent_token`; it is separate from the LINE ID Token.

### 2. API verification and lookup

- `API/Controllers/ParentEndpoints.cs` posts `id_token` and the configured `client_id` to LINE's ID Token Verify API.
- Only the verified `sub` is passed to the parent service.
- `API/Services/ParentService.cs` first looks up records associated with that LINE user ID.
- A previously linked LINE ID must resolve consistently to one parent account. Conflicting account IDs, missing users, or different existing LINE IDs fail closed.
- Phone lookup returns candidates, not an arbitrary first result. Duplicate/conflicting candidates fail closed.
- A phone-only lookup in normal mode returns `PHONE_VERIFICATION_REQUIRED`; implementing real first-time production binding requires OTP or a school-issued linking code.
- After successful existing-link authentication, returned children are scoped to the selected account's institute. This does not yet implement a general multi-institute institute-switching flow.

### 3. API response behavior

| Situation | HTTP | Code/behavior |
|---|---:|---|
| Verified LINE already linked to a consistent parent account | 200 | Returns app JWT, parent summary, and children |
| No LINE or phone record found | 404 | `PARENT_NOT_FOUND`; client may request phone input |
| Phone match without verified phone ownership in normal mode | 409 | `PHONE_VERIFICATION_REQUIRED`; no binding write, no app JWT |
| Duplicate phone candidates or conflicting LINE/account mapping | 409 | `PARENT_BINDING_REQUIRES_REVIEW`; no binding write, no app JWT |
| Missing ID token / invalid ID token | 400 / 401 | Authentication denied |

The server, not the client, is authoritative for whether test phone binding is enabled.

## `MODE_TEST_AUTH` local testing

This flag intentionally relaxes **only the phone ownership proof** for test data. It does not skip LINE ID Token verification and does not bypass duplicate/conflict checks.

### API-side guard (authoritative)

- `API/appsettings.Development.json` sets `MODE_TEST_AUTH` for local Development.
- `API/Controllers/ParentEndpoints.cs` enables test phone binding only when both conditions are true:
  - `IWebHostEnvironment.IsDevelopment()` is true; and
  - server configuration `MODE_TEST_AUTH` is true.
- Production must run with a non-Development environment and must not set `MODE_TEST_AUTH=true`. A frontend environment variable alone cannot enable the server-side bypass.
- Restart the API after changing settings.

### LIFF-side display flag (not a security control)

- `LineLiff/.env` can set `MODE_TEST_AUTH=true` to show the test-mode hint in the login screen.
- `LineLiff/vite.config.js` exposes this variable to Vite via `envPrefix`.
- Restart Vite after changing `.env`; Vite reads env files at startup/build.
- This browser flag is informational only. Never use it as the API's authorization decision.

### Safe test procedure

1. Use a local Development API connected to a non-production/test database.
2. Use a LINE account whose ID Token verifies against the configured LINE Login channel.
3. Enter a known test parent phone number that resolves to exactly one eligible account.
4. Confirm successful binding and that the expected parent/child records are returned.
5. Try a duplicate phone or a phone already linked to a different LINE ID; confirm a 409 and verify no database write occurred.
6. Before deploying, ensure the API environment is Production and `MODE_TEST_AUTH` is absent/false. Rebuild/redeploy after environment changes.

> Warning: with the server flag enabled, possession of a valid LINE session plus knowledge of a test parent phone can bind that LINE ID. Never enable this against production data, even temporarily.

## Data model and multi-child/multi-institute limits

- Multiple `Parent` rows can be associated to one `UserId`; these rows represent parent-child relationships.
- Same-account sibling rows may be returned together where they are associated to the same user and selected institute.
- A phone number is not a stable guardian identifier: it can be shared, duplicated across students/institutes, changed, or recycled.
- The current token contains one `institute_id`; it is not a complete multi-institute authorization design. Do not broaden global tenant filters or return all institutes' children without explicit per-request authorization.
- Production linking a new phone/account needs proof (OTP or school-issued code), a defined institute-selection/verification policy, explicit ambiguity handling, and tests before enabling it.

## Security invariants / regression checks

Keep these true when changing the flow:

- Trust LINE `sub` only after server-side verification for the expected channel ID.
- Never overwrite a different existing `Parent.LineUserId` or `User.LineUserId`.
- Never use `FirstOrDefault` as the conflict policy for phone matches.
- Ambiguous/conflicting matches must not mutate records or return an app JWT.
- Test phone binding is opt-in in server configuration and gated by Development environment.
- Phone-only binding is denied outside test mode until phone ownership verification is implemented.
- Keep institute isolation when returning parent/child data.

## Troubleshooting API 502 during local LIFF testing

- The public VPS API base is `http://165.101.65.84/api` on **port 80** (HTTP; omitted ports default to 80). Nginx receives public traffic on port 80 and proxies internally to the .NET service at `localhost:5000`. Port 5000 is an internal upstream port; clients should not need to connect to it directly.
- Local LineLiff uses `VITE_API_URL=/api`; the Vite dev server proxies `/api/*` to `http://165.101.65.84` so the browser does not make a cross-origin HTTP request. Restart Vite after editing `.env` or `vite.config.js`.
- Production LineLiff uses same-origin `/api` and the `LineLiff/vercel.json` rewrite to the VPS. The VPS health endpoint has been confirmed to return Healthy. If health is healthy but `/api/parents/bind-line` returns 502, inspect Vercel function/proxy logs and API/Nginx logs at the request timestamp. Do not infer that LINE token verification failed from a 502; invalid LINE tokens should return 401.
- A `VITE_API_URL` change is compiled into the Vite build. Redeploy/rebuild production after changing Vercel environment variables.

> The Vite development proxy target is the shared VPS. It uses the configured remote API/database, so do not run write tests against real accounts or production records. For isolated phone-binding tests, use a local API plus a non-production database and change the proxy target intentionally.

Regression tests live in `API/academy-API.Tests/unitTest/ParentServiceTests.cs`; run the backend test project after changing binding behavior. LIFF tests/build live under `LineLiff`.

## Source of truth

- Endpoint + LINE token verification: `API/Controllers/ParentEndpoints.cs`
- Binding decisions and status results: `API/Services/ParentService.cs`, `API/Services/Contracts/ParentServiceResults.cs`
- Candidate lookup and institute-specific children: `API/Repositories/ParentRepository.cs`
- Local API flag: `API/appsettings.Development.json`
- LIFF login and display hint: `LineLiff/src/pages/login.jsx`, `LineLiff/vite.config.js`, `LineLiff/.env`
- API contract summary: `Objective/specAPI.md`, section 13, Parents / LINE LIFF
