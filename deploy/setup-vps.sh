#!/bin/bash
# ====================================================================
# TiwHub Academy — Deploy Script for Ubuntu 24.04 LTS
# ====================================================================
# Run this script on your VPS after cloning the repo.
# Usage: bash deploy/setup-vps.sh
# ====================================================================

set -e

echo "=========================================="
echo "  TiwHub Academy — VPS Setup"
echo "  Ubuntu 24.04 LTS"
echo "=========================================="

# ─── 1. Update system ───
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ─── 2. Install dependencies ───
echo "[2/8] Installing .NET 9 Runtime, Nginx, Git..."
sudo apt install -y dotnet-runtime-9.0 nginx git curl

# ─── 3. Create directories ───
echo "[3/8] Creating application directories..."
sudo mkdir -p /var/www/my-app
sudo mkdir -p /var/www/my-api
sudo mkdir -p /var/www/temp-deploy
sudo chown -R root:root /var/www

# ─── 4. Setup systemd service ───
echo "[4/8] Installing systemd service..."
sudo cp deploy/my-api.service /etc/systemd/system/my-api.service
sudo systemctl daemon-reload
sudo systemctl enable my-api.service

# ─── 5. Configure Nginx ───
echo "[5/8] Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo cp deploy/nginx.conf /etc/nginx/sites-available/tiwhub
sudo ln -sf /etc/nginx/sites-available/tiwhub /etc/nginx/sites-enabled/
sudo nginx -t

# ─── 6. Setup swap (required for 1GB RAM builds) ───
echo "[6/8] Setting up 2GB swap..."
if ! swapon --show | grep -q /swapfile; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap created: 2GB"
else
    echo "Swap already exists"
fi

# ─── 7. Setup firewall ───
echo "[7/8] Configuring firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# ─── 8. Restart services ───
echo "[8/8] Restarting services..."
sudo systemctl restart nginx

echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Build & deploy the API:"
echo "     cd ~/projects/tiwhub/API"
echo "     dotnet publish -c Release -o /var/www/my-api --self-contained false"
echo "     sudo chown -R www-data:www-data /var/www/my-api"
echo "     sudo systemctl start my-api.service"
echo ""
echo "  2. Build & deploy the Frontend:"
echo "     cd ~/projects/tiwhub/Front"
echo "     npm install"
echo "     npm run build"
echo "     sudo cp -r dist/* /var/www/my-app/"
echo "     sudo chown -R www-data:www-data /var/www/my-app"
echo ""
echo "  3. Set environment variables (optional):"
echo "     export ThaiDataCloud__AccessKey=your_key"
echo "     export ThaiDataCloud__SecretKey=your_secret"
echo "     export Jwt__Key=your_jwt_secret"
echo "     export ConnectionStrings__TutoringDbConnection=your_connection_string"
echo ""