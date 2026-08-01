#!/bin/bash
# ====================================================================
# TiwHub Academy — Build & Deploy Script
# ====================================================================
# Run this on your VPS after pulling new code from Git.
# Usage: bash deploy/build-and-deploy.sh
# ====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  TiwHub Academy — Build & Deploy"
echo "=========================================="

# ─── 1. Build Backend (.NET 9) ───
echo "[1/3] Building .NET API..."
cd "$PROJECT_DIR/API"
dotnet publish -c Release -o /var/www/my-api --self-contained false
sudo chown -R www-data:www-data /var/www/my-api

# ─── 2. Build Frontend (Preact + Vite) ───
echo "[2/4] Building Admin Frontend..."
cd "$PROJECT_DIR/Front"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
sudo cp -r dist/* /var/www/my-app/
sudo chown -R www-data:www-data /var/www/my-app

# ─── 3. Build LINE LIFF ───
echo "[3/4] Building LINE LIFF..."
cd "$PROJECT_DIR/LineLiff"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
sudo mkdir -p /var/www/my-app/liff
sudo cp -r dist/* /var/www/my-app/liff/
sudo chown -R www-data:www-data /var/www/my-app

# ─── 4. Restart services ───
echo "[4/4] Restarting services..."
sudo systemctl restart my-api.service
sudo systemctl restart nginx

echo "=========================================="
echo "  Deploy complete!"
echo "=========================================="