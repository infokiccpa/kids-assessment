#!/usr/bin/env bash
# First-time EC2 bootstrap
# Supports: Amazon Linux 2023, Ubuntu 22.04/24.04
# Usage: chmod +x deploy/ec2-setup.sh && ./deploy/ec2-setup.sh

set -euo pipefail

install_node_22() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -v)" == v22* ]]; then
    return
  fi

  echo "==> Installing Node.js 22..."
  if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
    . /etc/os-release
    case "${ID:-}" in
      amzn)
        curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
        sudo dnf install -y nodejs
        ;;
      ubuntu|debian)
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
        ;;
      *)
        echo "Unsupported OS: ${ID}. Install Node.js 22 manually."
        exit 1
        ;;
    esac
  fi
}

install_packages() {
  if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
    . /etc/os-release
    case "${ID:-}" in
      amzn)
        echo "==> Amazon Linux detected — installing packages with dnf..."
        sudo dnf update -y
        sudo dnf install -y git nginx curl
        # Certbot (optional, for HTTPS)
        sudo dnf install -y epel-release 2>/dev/null || true
        sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || \
          echo "Note: certbot not installed — add SSL manually later if needed."
        sudo systemctl enable nginx
        sudo systemctl start nginx
        ;;
      ubuntu|debian)
        echo "==> Ubuntu/Debian detected — installing packages with apt..."
        sudo apt-get update -y
        sudo apt-get install -y curl git nginx certbot python3-certbot-nginx
        sudo systemctl enable nginx
        sudo systemctl start nginx
        ;;
      *)
        echo "Unsupported OS: ${ID}"
        exit 1
        ;;
    esac
  fi
}

install_packages
install_node_22

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2..."
  sudo npm install -g pm2
fi

echo ""
echo "==> Node: $(node -v)"
echo "==> npm:  $(npm -v)"
echo "==> PM2:  $(pm2 -v)"
echo ""
echo "Setup complete. Next steps:"
echo "  1. git clone https://github.com/infokiccpa/kids-assessment.git"
echo "  2. cd kids-assessment"
echo "  3. cp deploy/env.production.example .env && nano .env"
echo "  4. ./deploy/ec2-deploy.sh"
echo ""
if [[ "${ID:-}" == "amzn" ]]; then
  echo "  5. Nginx (Amazon Linux):"
  echo "       sudo cp deploy/nginx-kids-assessment.conf /etc/nginx/conf.d/kids-assessment.conf"
  echo "       # edit server_name to your Elastic IP or domain"
  echo "       sudo nginx -t && sudo systemctl reload nginx"
else
  echo "  5. Nginx (Ubuntu):"
  echo "       sudo cp deploy/nginx-kids-assessment.conf /etc/nginx/sites-available/kids-assessment"
  echo "       sudo ln -sf /etc/nginx/sites-available/kids-assessment /etc/nginx/sites-enabled/"
  echo "       sudo rm -f /etc/nginx/sites-enabled/default"
  echo "       sudo nginx -t && sudo systemctl reload nginx"
fi
echo "  6. SSL (optional): sudo certbot --nginx -d your-domain.com"
