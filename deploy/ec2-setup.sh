#!/usr/bin/env bash
# First-time EC2 bootstrap (Ubuntu 22.04 / 24.04)
# Run on the server as ubuntu user:
#   curl -fsSL <raw-url>/deploy/ec2-setup.sh | bash
# Or after cloning:
#   chmod +x deploy/ec2-setup.sh && ./deploy/ec2-setup.sh

set -euo pipefail

echo "==> Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v22* ]]; then
  echo "==> Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2..."
  sudo npm install -g pm2
fi

echo "==> Node: $(node -v)"
echo "==> npm:  $(npm -v)"
echo "==> PM2:  $(pm2 -v)"
echo ""
echo "Setup complete. Next steps:"
echo "  1. Clone the repo:  git clone https://github.com/infokiccpa/kids-assessment.git"
echo "  2. Create .env:     cd kids-assessment && nano .env"
echo "  3. Deploy:          ./deploy/ec2-deploy.sh"
echo "  4. Configure nginx: sudo cp deploy/nginx-kids-assessment.conf /etc/nginx/sites-available/kids-assessment"
echo "                      sudo ln -sf /etc/nginx/sites-available/kids-assessment /etc/nginx/sites-enabled/"
echo "                      sudo rm -f /etc/nginx/sites-enabled/default"
echo "                      sudo nginx -t && sudo systemctl reload nginx"
echo "  5. SSL (optional):  sudo certbot --nginx -d your-domain.com"
