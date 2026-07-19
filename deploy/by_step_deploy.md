# TiwHub Academy — Deploy Guide (VPS Ubuntu 24.04)

> **Last updated:** 2026-07-19  
> **Stack:** .NET 9 API + Preact (Vite) Frontend + TiDB (MySQL) + Nginx  
> **VPS Spec:** Ubuntu 24.04 LTS, RAM 1GB (ต้องมี Swap 2GB)

---

## สารบัญ

1. [เตรียมความพร้อม VPS](#1-เตรียมความพร้อม-vps)
2. [ตั้งค่า GitHub Secrets](#2-ตั้งค่า-github-secrets)
3. [รัน Setup Script ครั้งเดียว](#3-รัน-setup-script-ครั้งเดียว)
4. [Deploy ครั้งแรก (Manual)](#4-deploy-ครั้งแรก-manual)
5. [Deploy อัตโนมัติด้วย GitHub Actions](#5-deploy-อัตโนมัติด้วย-github-actions)
6. [การอัปเดตระบบในอนาคต](#6-การอัปเดตระบบในอนาคต)
7. [การแก้ไขปัญหา](#7-การแก้ไขปัญหา)

---

## 1. เตรียมความพร้อม VPS

### 1.1 SSH เข้า VPS

```bash
ssh root@<IP_VPS>
```

### 1.2 เปลี่ยนรหัสผ่าน root (ครั้งแรก)

```bash
passwd
```

### 1.3 ตรวจสอบว่าเป็น Ubuntu 24.04

```bash
lsb_release -a
# ควรเห็น: Description: Ubuntu 24.04 LTS
```

---

## 2. ตั้งค่า GitHub Secrets

เข้าไปที่ GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VPS_HOST` | IP Address หรือ Domain ของ VPS | `123.123.123.123` |
| `VPS_USERNAME` | SSH Username | `root` |
| `VPS_SSH_KEY` | SSH Private Key (เปิดดูด้านล่าง) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### วิธีสร้าง SSH Key สำหรับ GitHub Actions

```bash
# รันบน VPS (หรือเครื่อง local)
ssh-keygen -t ed25519 -f ~/.ssh/tiwhub-deploy -N ""

# ดู public key เพื่อเพิ่มใน VPS authorized_keys
cat ~/.ssh/tiwhub-deploy.pub

# เพิ่ม public key เข้า VPS
echo "<public_key>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# ดู private key เพื่อใส่ใน GitHub Secrets
cat ~/.ssh/tiwhub-deploy
```

---

## 3. รัน Setup Script ครั้งเดียว

SSH เข้า VPS แล้ว clone repository และรัน setup

```bash
# 1. SSH เข้า VPS
ssh root@<IP_VPS>

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

# 3. ติดตั้ง dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y dotnet-runtime-9.0 nginx git curl

# 4. Clone โค้ด
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/<your-org>/<your-repo>.git tiwhub
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
npm install
npm run build
sudo cp -r dist/* /var/www/my-app/
sudo chown -R www-data:www-data /var/www/my-app

# ─── 4.3 ตั้งค่า Environment Variables ───
# ควรใช้ Environment Variables แทน appsettings.json เพื่อความปลอดภัย
# กรณี production: ใส่ Connection String, JWT Key, OSS Keys

sudo mkdir -p /etc/systemd/system/my-api.service.d/
sudo tee /etc/systemd/system/my-api.service.d/override.conf << 'EOF'
[Service]
Environment="ASPNETCORE_ENVIRONMENT=Production"
Environment="ASPNETCORE_URLS=http://localhost:5000"
Environment="ConnectionStrings__TutoringDbConnection=server=gateway01.ap-southeast-1.prod.aws.tidbcloud.com;port=4000;database=tutoring_db;user=4KAdV4BEXUcN5nB.root;password=1RbhxfnJ0CLNSdLp;SslMode=Required"
Environment="Jwt__Key=ThisIsASuperSecretKeyForJWTSigningThatMustBeAtLeast32CharactersLong!"
Environment="Jwt__Issuer=academy-api"
Environment="Jwt__Audience=academy-api-client"
Environment="ThaiDataCloud__ServiceUrl=https://oss-ap-southeast-7.aliyuncs.com"
Environment="ThaiDataCloud__AccessKey=LTAI5tFhmuvRzqkyzWUmvjSN"
Environment="ThaiDataCloud__SecretKey=mbqAegnVgG5SPNM5fAayDCaVd2SG8y"
Environment="ThaiDataCloud__BucketName=tiwhub"
Environment="ThaiDataCloud__PublicUrl=https://tiwhub.oss-ap-southeast-7.aliyuncs.com"
EOF

# ─── 4.4 เริ่ม API Service ───
sudo systemctl daemon-reload
sudo systemctl start my-api.service

# ─── 4.5 ตรวจสอบ ───
sudo systemctl status my-api.service
# ควรเห็น: active (running)

# ตรวจสอบ API
curl http://localhost:5000/api/health

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
3. รอจน status เป็น **綠色** (success)
4. เปิด browser ไปที่ `http://<IP_VPS>`

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
ssh root@<IP_VPS>
cd ~/projects/tiwhub
git pull

# Backend
cd API
dotnet publish -c Release -o /var/www/my-api --self-contained false
sudo chown -R www-data:www-data /var/www/my-api
sudo systemctl restart my-api.service

# Frontend
cd ../Front
npm install
npm run build
sudo cp -r dist/* /var/www/my-app/
sudo chown -R www-data:www-data /var/www/my-app
sudo systemctl restart nginx
```

### 6.3 หรือใช้ Script (ไวที่สุด)

```bash
ssh root@<IP_VPS>
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

# ตรวจสอบ Connection String
sudo systemctl show my-api.service -p Environment

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

เพิ่ม domain ของ production ใน `Program.cs`:
```csharp
policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://<IP_VPS>", "https://<domain>")
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

### 7.5 SSL Certificate (HTTPS)

ใช้ Let's Encrypt + Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Auto-renew
sudo certbot renew --dry-run
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
| `deploy/setup-vps.sh` | Setup ครั้งเดียว (ติดตั้ง dependencies, Nginx, systemd) |
| `deploy/build-and-deploy.sh` | Build + Deploy หลังจาก git pull |
| `deploy/my-api.service` | Systemd service file |
| `deploy/nginx.conf` | Nginx configuration |
| `.github/workflows/deploy.yml` | GitHub Actions auto-deploy |