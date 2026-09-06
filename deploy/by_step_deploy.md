# TiwHub Academy — Deploy Guide (VPS Ubuntu 22.04 LTS)

> **Last updated:** 2026-09-05  
> **Stack:** .NET 9 ASP.NET Core API + Preact (Vite) Frontend + TiDB (MySQL) + Nginx  
> **VPS Spec:** Ubuntu 22.04 LTS, RAM 1GB (ต้องมี Swap 2GB)
>
> **สำคัญ:** ห้ามใส่ production secrets ลงใน repository, Markdown หรือคำสั่งใน shell history
>
> หาก repository นี้เคยเผยแพร่ค่า database password, JWT key หรือ OSS key ให้ rotate/revoke ค่าทั้งหมดก่อน deploy และตรวจสอบ Git history ด้วย

---

## สารบัญ

1. [เตรียมความพร้อม VPS](#1-เตรียมความพร้อม-vps)
2. [ตั้งค่า GitHub Secrets](#2-ตั้งค่า-github-secrets)
3. [เตรียมระบบครั้งเดียว](#3-เตรียมระบบครั้งเดียว)
4. [Deploy ครั้งแรก (Manual)](#4-deploy-ครั้งแรก-manual)
5. [Deploy อัตโนมัติด้วย GitHub Actions](#5-deploy-อัตโนมัติด้วย-github-actions)
6. [การอัปเดตระบบในอนาคต](#6-การอัปเดตระบบในอนาคต)
7. [การแก้ไขปัญหา](#7-การแก้ไขปัญหา)
8. [Security Checklist](#8-security-checklist)

---

## 1. เตรียมความพร้อม VPS

### 1.1 SSH เข้า VPS

```bash
# ใช้ root เฉพาะครั้งแรกเพื่อสร้าง deploy user หากผู้ให้บริการไม่มี user sudo
ssh root@<IP_VPS>
```

### 1.2 สร้าง deploy user (แนะนำ)

```bash
adduser deploy
usermod -aG sudo deploy

# หลังจากติดตั้ง SSH key และทดสอบ deploy user สำเร็จแล้ว
# จึงทำ SSH hardening ตามข้อ 8.1 เพื่อปิด root/password login
```

### 1.3 ตรวจสอบว่าเป็น Ubuntu 22.04

```bash
lsb_release -a
# ควรเห็น: Description: Ubuntu 22.04.x LTS
```

---

## 2. ตั้งค่า GitHub Secrets

เข้าไปที่ GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VPS_HOST` | IP Address หรือ Domain ของ VPS | `123.123.123.123` |
| `VPS_USERNAME` | SSH Username | `deploy` |
| `VPS_SSH_KEY` | SSH Private Key (เปิดดูด้านล่าง) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### วิธีสร้าง SSH Key สำหรับ GitHub Actions

```bash
# รันบนเครื่อง local ที่ใช้ deploy และเก็บ private key ไว้เป็นความลับ
ssh-keygen -t ed25519 -f ~/.ssh/tiwhub-deploy -N ""

# ดู public key เพื่อเพิ่มใน VPS authorized_keys
cat ~/.ssh/tiwhub-deploy.pub

# เพิ่ม public key เข้า /home/deploy/.ssh/authorized_keys บน VPS
# ตรวจสอบ permission: directory 700 และไฟล์ authorized_keys 600

# ดู private key เพื่อใส่ใน GitHub Secrets
cat ~/.ssh/tiwhub-deploy
```

---

## 3. เตรียมระบบครั้งเดียว

SSH เข้า VPS แล้ว clone repository จากนั้นรันคำสั่งด้านล่างตามลำดับ
ขั้นตอนนี้เป็น manual setup ที่รองรับ Ubuntu 22.04; หากใช้ `deploy/setup-vps.sh` ต้องตรวจสอบและปรับ script ให้ตรงกับเอกสารนี้ก่อน

```bash
# 1. SSH เข้า VPS ด้วย user ที่มี sudo
ssh deploy@<IP_VPS>

# 2. สร้าง Swap 2GB (จำเป็นสำหรับ RAM 1GB)
bash -c '
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab
'
# ตรวจสอบ
free -h

# 3. ติดตั้ง dependencies สำหรับ Ubuntu 22.04
sudo apt update && sudo apt upgrade -y
sudo apt install -y software-properties-common nginx git curl ca-certificates

# .NET 9 บน Ubuntu 22.04 ให้ใช้ Ubuntu .NET backports
sudo add-apt-repository -y ppa:dotnet/backports
sudo apt update
sudo apt install -y aspnetcore-runtime-9.0

# Node.js 20 LTS สำหรับ build Front และ LineLiff
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

dotnet --list-runtimes
node --version
npm --version

# 4. Clone โค้ด
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/anatchai27/Acadamy-Frontend.git tiwhub
cd tiwhub

# 5. สร้าง directory
sudo mkdir -p /var/www/my-app
sudo mkdir -p /var/www/my-api
sudo mkdir -p /var/www/temp-deploy

# 6. ติดตั้ง systemd service
sudo cp deploy/my-api.service /etc/systemd/system/my-api.service
sudo systemctl daemon-reload
sudo systemctl enable my-api.service

# 7. ตั้งค่า Nginx
sudo rm -f /etc/nginx/sites-enabled/default
sudo cp deploy/nginx.conf /etc/nginx/sites-available/tiwhub
sudo ln -sf /etc/nginx/sites-available/tiwhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. ตั้งค่า firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status

# ถ้า SSH ใช้ port อื่น ให้เปิด port นั้นแทน 22 ก่อน enable UFW
```

---

## 4. Deploy ครั้งแรก (Manual)

หลังจาก setup ครั้งเดียวเสร็จ ให้ build และ deploy บน VPS

```bash
# ยังอยู่ใน ~/projects/tiwhub

# ─── 4.1 Build Backend ───
cd ~/projects/tiwhub/API
dotnet publish -c Release -o /var/www/my-api --self-contained false
sudo chown -R www-data:www-data /var/www/my-api

# ─── 4.2 Build Frontend ───
cd ~/projects/tiwhub/Front
npm ci
npm run build
sudo cp -r dist/* /var/www/my-app/
sudo chown -R www-data:www-data /var/www/my-app

# ─── 4.3 ตั้งค่า Environment Variables ───
# ห้ามใส่ค่าจริงใน repository หรือเอกสารนี้
sudo install -d -m 750 -o root -g www-data /etc/tiwhub
sudo install -m 640 -o root -g www-data /dev/null /etc/tiwhub/my-api.env
sudoedit /etc/tiwhub/my-api.env

sudo mkdir -p /etc/systemd/system/my-api.service.d/
sudo tee /etc/systemd/system/my-api.service.d/override.conf << 'EOF'
[Service]
EnvironmentFile=/etc/tiwhub/my-api.env
Environment="ASPNETCORE_ENVIRONMENT=Production"
Environment="ASPNETCORE_URLS=http://localhost:5000"
EOF

# ใส่ค่าจริงใน /etc/tiwhub/my-api.env เท่านั้น เช่น:
# ConnectionStrings__TutoringDbConnection=...
# Jwt__Key=<สุ่มค่าอย่างน้อย 32 ตัวอักษร>
# Jwt__Issuer=academy-api
# Jwt__Audience=academy-api-client
# ThaiDataCloud__ServiceUrl=...
# ThaiDataCloud__AccessKey=...
# ThaiDataCloud__SecretKey=...
# ThaiDataCloud__BucketName=tiwhub
# ThaiDataCloud__PublicUrl=...

# ─── 4.4 เริ่ม API Service ───
sudo systemctl daemon-reload
sudo systemctl start my-api.service

# ─── 4.5 ตรวจสอบ ───
sudo systemctl status my-api.service
# ควรเห็น: active (running)

# ตรวจสอบ API (ใช้ endpoint ที่มีอยู่จริงของโปรเจกต์)
curl -i http://localhost:5000/

# ตรวจสอบ Frontend
curl http://localhost/

# ดู logs
sudo journalctl -u my-api.service -f
```

---

## 5. Deploy อัตโนมัติด้วย GitHub Actions

### 5.1 ตั้งค่า SSH Key ใน GitHub

1. ไปที่ GitHub Repo → **Settings** → **Secrets and variables** → **Actions**
2. กด **New repository secret**
3. เพิ่ม secrets ตามตารางใน [ข้อ 2](#2-ตั้งค่า-github-secrets)

### 5.2 Push โค้ดเพื่อทดสอบ

```bash
git add .
git commit -m "init: first deploy setup"
git push origin main
```

### 5.3 ตรวจสอบการทำงาน

1. ไปที่ GitHub Repo → **Actions** tab
2. ดู workflow **Deploy to VPS** กำลังทำงาน
3. รอจน status เป็น **สีเขียว** (success)
4. เปิด browser ไปที่ `https://<domain>`

---

## 6. การอัปเดตระบบในอนาคต

### 6.1 ด้วย GitHub Actions (อัตโนมัติ)

แค่ `git push` ขึ้น `main` branch — Actions จะ build + deploy ให้อัตโนมัติ

```bash
git add .
git commit -m "fix: something"
git push origin main
```

### 6.2 Manual (SSH เข้าไปรันเอง)

```bash
ssh deploy@<IP_VPS>
cd ~/projects/tiwhub
git pull

# Backend
cd API
dotnet publish -c Release -o /var/www/my-api --self-contained false
sudo chown -R www-data:www-data /var/www/my-api
sudo systemctl restart my-api.service

# Frontend
cd ../Front
npm ci
npm run build
sudo cp -r dist/* /var/www/my-app/
sudo chown -R www-data:www-data /var/www/my-app
sudo systemctl restart nginx
```

### 6.3 หรือใช้ Script (ไวที่สุด)

```bash
ssh deploy@<IP_VPS>
cd ~/projects/tiwhub
git pull
bash deploy/build-and-deploy.sh
```

---

## 7. การแก้ไขปัญหา

### 7.1 API 500 error หลัง deploy

```bash
# ดู logs
sudo journalctl -u my-api.service -n 50 --no-pager

# ตรวจสอบ service และ environment file โดยไม่พิมพ์ secret ออกทาง terminal
sudo systemctl status my-api.service --no-pager
sudo systemctl cat my-api.service
sudo ls -l /etc/tiwhub/my-api.env

# ทดสอบรันตรงๆ
sudo -u www-data dotnet /var/www/my-api/academy-API.dll
```

### 7.2 Frontend 404 (เรียก refresh แล้วไม่เจอ)

ตรวจสอบ Nginx config: `try_files $uri $uri/ /index.html;` ต้องมี

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 7.3 CORS Error

เพิ่ม HTTPS domain ของ production ใน `Program.cs`:
```csharp
policy.WithOrigins("https://<domain>")
```

### 7.4 Build ใช้ RAM จนเครื่องค้าง

ต้องมี Swap 2GB:

```bash
free -h
# ถ้า swap เป็น 0 ให้สร้าง
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### 7.5 SSL Certificate (HTTPS) — จำเป็นสำหรับ production

ใช้ Let's Encrypt + Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Auto-renew
sudo certbot renew --dry-run
```

หลังติดตั้ง certificate ให้ตรวจสอบว่า Nginx redirect HTTP ไป HTTPS และใช้ HTTPS domain เดียวกันใน CORS, LIFF และ frontend configuration

---

## 8. Security Checklist

> มาตรฐานขั้นต่ำก่อนนำระบบขึ้นใช้งานจริง ป้องกันการถูกเจาะ/แฮกในระดับพื้นฐาน
> ควรทำตามหัวข้อนี้ทั้งหมดบน VPS ที่ deploy

### 8.1 SSH Hardening (สำคัญที่สุด)

ห้ามรันระบบโดยใช้ root หรือให้ SSH ผ่าน password

สร้างไฟล์ `/etc/ssh/sshd_config.d/99-hardening.conf`:

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
MaxAuthTries 3
LoginGraceTime 20
PubkeyAuthentication yes
AllowUsers deploy
EOF

# ทดสอบ syntax ก่อน reload เสมอ
sudo sshd -t
sudo systemctl reload ssh
```

**ข้อควรระวัง:** ให้เปิด SSH session ที่ 2 ไว้เสมอ ก่อน reload เพื่อไม่ให้ lock ตัวเองออกจากเครื่อง
**แนะนำ:** จำกัด SSH ให้มาจาก IP ที่รู้จักเท่านั้น เช่น

```bash
sudo ufw allow from <IP_ที่ทำงาน/บ้าน> to any port 22 proto tcp
```

### 8.2 Firewall (UFW) — deny by default

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

ให้เฉพาะ port ที่จำเป็นเท่านั้น เปิดจากภายนอก

### 8.3 อัปเดตความปลอดภัยอัตโนมัติ

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
# เลือก Yes เพื่อให้ระบบอัปเดต security patch อัตโนมัติ

# ตรวจสอบสถานะ
sudo systemctl status unattended-upgrades --no-pager
```

### 8.4 Fail2ban — กัน brute force SSH/Nginx

```bash
sudo apt install -y fail2ban

sudo tee /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 1h

[nginx-http-auth]
enabled = true
EOF

sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

### 8.5 HTTPS บังคับทุกหน้า (ไม่เปิดเฉพาะ HTTP)

- ต้องติดตั้ง SSL ตาม [ข้อ 7.5](#75-ssl-certificate-https--จำเป็นสำหรับ-production) ก่อนประกาศใช้งานจริง
- Nginx ต้อง `return 301 https://$host$request_uri;` จาก port 80
- ห้ามเรียกใช้งานจริงผ่าน `http://` หรือ IP เปล่า
- หลัง Certbot สร้าง `server` block ของ HTTPS แล้ว ให้เพิ่ม HSTS ใน block นั้น:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 8.6 Nginx Security Headers และซ่อนเวอร์ชัน

`deploy/nginx.conf` ที่แจกในโปรเจกต์นี้มีค่าดังต่อไปนี้แล้ว:

- `server_tokens off;` — ปิดการโชว์เวอร์ชัน Nginx
- `autoindex off;` — ปิดการ list directory
- `add_header X-Content-Type-Options "nosniff" always;`
- `add_header X-Frame-Options "SAMEORIGIN" always;`
- `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`
- `add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;`
- ปิดการเข้าไฟล์/โฟลเดอร์ที่ขึ้นต้นด้วย `.` (เช่น `.git`, `.env`)

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I http://localhost/ | grep -i 'server:\|x-content-type\|x-frame'
# server: ต้องไม่มี nginx/<version> ต่อท้าย
```

### 8.7 Secret Management

- ค่าลับทั้งหมดอยู่ใน `/etc/tiwhub/my-api.env` เท่านั้น
- ตรวจสอบ permission ทุกครั้ง:

```bash
sudo ls -l /etc/tiwhub/my-api.env
# ต้องเป็น -rw-r----- 1 root www-data
sudo chmod 640 /etc/tiwhub/my-api.env
sudo chgrp www-data /etc/tiwhub/my-api.env
```

- ห้าม commit secret ลง Git (ดู [ข้อ 4.3](#43-ตั้งค่า-environment-variables))
- หมุน JWT Key และ Access Key เป็นระยะ โดยเฉพาะเมื่อมีคนลาออกหรือ key รั่ว

### 8.8 ตรวจสอบสิ่งที่เปิดเผยสู่ภายนอก

```bash
sudo ss -tulpn
```

ผลลัพธ์ที่ถูกต้องคือ มีเฉพาะ:

- `22` SSH
- `80` / `443` Nginx
- API ต้องเป็น `127.0.0.1:5000` เท่านั้น (ไม่ใช่ `0.0.0.0`)

ถ้าเห็น port อื่นเปิดสู่ `0.0.0.0` ให้ปิดด้วย UFW และแก้ config

### 8.9 Backup ข้อมูลขั้นต่ำ

ทำ backup อัตโนมัติอย่างน้อยวันละ 1 ครั้ง เก็บนอกเครื่อง (เช่น OSS bucket เดิมที่ access key แยกจาก access key ของแอป):

- Database TiDB (ใช้ managed backup ของ TiDB Cloud หรือ `mysqldump`)
- `deploy/` และ `deploy/nginx.conf` ที่ปรับแล้ว
- `/etc/systemd/system/my-api.service*`

ทดสอบ restore อย่างน้อยเดือนละครั้ง

### 8.10 ตรวจ log สม่ำเสมอ

```bash
# SSH และ fail2ban
sudo journalctl -u ssh -u fail2ban --since today

# Nginx
sudo tail -n 100 /var/log/nginx/error.log

# แอปพลิเคชัน
sudo journalctl -u my-api.service --since today
```

### 8.11 Systemd service hardening

`deploy/my-api.service` มีการจำกัดสิทธิ์ของ process API ไว้แล้ว:

- `NoNewPrivileges=true` — ปิดการยกระดับสิทธิ์เพิ่มเติม
- `PrivateTmp=true` — แยก `/tmp` ส่วนตัว
- `ProtectHome=true` — ปิดการเข้าถึง `/home`
- `ProtectKernelTunables=true` / `ProtectKernelModules=true` / `ProtectControlGroups=true`
- `RestrictSUIDSGID=true` / `RestrictRealtime=true`

ตรวจสอบสถานะหลังติดตั้งทุกครั้ง:

```bash
sudo systemctl daemon-reload
sudo systemctl start my-api.service
sudo systemctl status my-api.service --no-pager
# ต้องเห็น: active (running)

# ตรวจสอบว่า sandbox ทำงานจริง
sudo systemd-analyze security my-api.service
```

---

## Architecture Diagram

```
Internet
    │
    ▼
Nginx (Port 80/443)
    │
    ├── / (static files) ──► /var/www/my-app/
    │
    └── /api/* ──► reverse proxy ──► http://localhost:5000
                                        │
                                        ▼
                                    .NET 9 API
                                        │
                                        ▼
                                   TiDB (MySQL)
                                        │
                                        ▼
                                   Alibaba Cloud OSS
```

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | ใช้สำหรับ |
|------|---------|
| `deploy/setup-vps.sh` | Setup ครั้งเดียว (ควรตรวจสอบให้ตรงกับขั้นตอน Ubuntu 22.04 ในเอกสารนี้) |
| `deploy/build-and-deploy.sh` | Build + Deploy หลังจาก git pull |
| `deploy/my-api.service` | Systemd service file |
| `deploy/nginx.conf` | Nginx configuration (มี security headers, ซ่อนเวอร์ชัน, ปิด dotfile) |
| `.github/workflows/deploy.yml` | GitHub Actions auto-deploy |
