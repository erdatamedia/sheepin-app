#!/usr/bin/env bash
# Update Sheep-In di VPS: tarik kode, pasang dependensi, migrasi, build, restart.
# Pakai:  ./scripts/deploy.sh [branch]      (default: main)
#         SKIP_MIGRATE=1 ./scripts/deploy.sh [branch]   (lewati migrasi Prisma)
set -euo pipefail

BRANCH="${1:-main}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Pemeriksaan awal"
[ -f backend/.env ] || { echo "backend/.env belum ada"; exit 1; }
[ -f frontend/.env.local ] || echo "Catatan: frontend/.env.local tidak ada; frontend memakai /api (reverse proxy satu domain)."
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Working tree punya perubahan lokal. Bersihkan dulu (git status)."; exit 1
fi

echo "==> Tarik kode ($BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Backend"
cd backend
pnpm install --frozen-lockfile
pnpm prisma:generate
if [ "${SKIP_MIGRATE:-0}" = "1" ]; then
  echo "SKIP_MIGRATE=1: migrasi dilewati (pakai hanya bila rilis tidak mengubah prisma/)"
else
  pnpm db:migrate:deploy
fi
pnpm build
cd ..

echo "==> Frontend"
cd frontend
pnpm install --frozen-lockfile
# Batasi memori build agar tidak menjatuhkan VPS kecil
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}" pnpm build
cd ..

echo "==> Restart"
if command -v pm2 >/dev/null 2>&1 && pm2 describe sheepin-backend >/dev/null 2>&1; then
  # hanya dua proses milik Sheep-In; server bisa dipakai bersama aplikasi lain
  pm2 reload sheepin-backend
  pm2 reload sheepin-frontend
else
  echo "pm2 / proses 'sheepin-backend' tidak ditemukan. Restart manual:"
  echo "  backend : cd backend && pnpm start:prod        (port 8000)"
  echo "  frontend: cd frontend && pnpm start -p 3000"
fi

echo "==> Selesai. Cek: curl -s http://localhost:8000/api/pemantauan/status"
