#!/usr/bin/env bash
# Build and restart the app on EC2
# Usage: ./deploy/ec2-deploy.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $APP_DIR"
  echo "Copy .env.example to .env and fill in production values."
  exit 1
fi

echo "==> Pulling latest code..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull origin main
else
  echo "Not a git repo yet — skipping pull."
fi

echo "==> Installing dependencies..."
npm ci

echo "==> Building production bundle..."
npm run build:docker

echo "==> Seeding demo admin (if missing)..."
npm run seed:admin || true

echo "==> Restarting PM2 process..."
if pm2 describe kids-assessment >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
  pm2 save
  PM2_USER="${USER:-ec2-user}"
  pm2 startup systemd -u "$PM2_USER" --hp "$HOME" | tail -1 | sudo bash || true
fi

echo "==> Health check..."
sleep 2
curl -fsS "http://127.0.0.1:3000/api/health" && echo ""

echo "Deploy complete."
