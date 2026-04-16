# Sheep-In

Sheep-In adalah aplikasi web untuk rekording ternak domba yang dirancang mengikuti alur kerja peternak di lapangan, bukan sekadar struktur tabel database.

Fokus utamanya:

- pilih ternak
- catat bobot, BCS, kesehatan, dan kejadian penting
- simpan cepat
- lihat riwayat dan tindak lanjut
- pantau persebaran peternak dan ternak

## Tujuan Produk

Sheep-In dibangun agar peternak, petugas lapangan, dan admin bisa bekerja dalam satu sistem yang sama dengan antarmuka yang dibedakan sesuai peran:

- `FARMER`: fokus pada kerja harian, ternak milik sendiri, rekording cepat, riwayat, dan lokasi
- `OFFICER`: fokus pada pendampingan lapangan, input, koreksi, dan monitoring data
- `ADMIN`: fokus pada kontrol data, distribusi peternak, dan pemantauan operasional

## Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Leaflet untuk peta

### Backend

- NestJS
- Prisma ORM
- PostgreSQL

## Fitur Utama

- autentikasi multi-role
- login peternak dengan `loginCode`
- login admin/petugas dengan email dan password
- manajemen ternak
- kepemilikan ternak berbasis `ownerUserId`
- rekording cepat
- riwayat rekording gabungan
- evaluasi ternak
- lokasi peternak
- peta sebaran peternak
- upload foto profil dan foto ternak
- landing page publik dengan peta sebaran peternak terdaftar

## Struktur Repository

Repository ini menggunakan struktur monorepo sederhana:

```text
sheepin/
├── backend/   # NestJS + Prisma + PostgreSQL
└── frontend/  # Next.js app
```

## Menjalankan Lokal

### 1. Jalankan backend

```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm db:migrate:dev
pnpm start:dev
```

Backend default berjalan di:

```text
http://localhost:8000/api
```

### 2. Jalankan frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend default berjalan di:

```text
http://localhost:3000
```

## Environment Backend

Minimal variabel yang perlu disiapkan di `backend/.env`:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
MEDIA_PUBLIC_BASE_URL=https://aset.domain-anda.com
STORAGE_DRIVER=lokal
```

Catatan:

- `MEDIA_PUBLIC_BASE_URL` dipakai agar URL aset siap dipindah ke object storage atau CDN
- implementasi upload saat ini masih menggunakan penyimpanan lokal sebagai fallback

## Migrasi Database

### Development

```bash
cd backend
pnpm prisma:generate
pnpm db:migrate:dev
```

### Production

```bash
cd backend
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm build
pnpm start:prod
```

Untuk cek status migrasi:

```bash
cd backend
pnpm db:migrate:status
```

## Quality Gate

### Backend

```bash
cd backend
pnpm lint
pnpm build
pnpm test:smoke
```

### Frontend

```bash
cd frontend
pnpm lint
pnpm build
```

## Endpoint Penting

### Backend

- `POST /api/auth/login`
- `POST /api/auth/login-farmer`
- `GET /api/auth/me`
- `GET /api/users/me/sheep`
- `PATCH /api/users/me/profile`
- `POST /api/media/unggah-gambar`
- `GET /api/map/distribution`
- `GET /api/map/distribution-public`
- `GET /api/pemantauan/status`

## Catatan Deploy

Status saat ini:

- frontend dan backend sudah lolos lint dan build
- smoke test backend sudah tersedia
- observability dasar sudah tersedia melalui logging dan endpoint pemantauan
- landing page publik sudah tersedia
- farmer sudah bisa menambah ternak sendiri dari halaman ternak

Hal yang masih perlu diperkuat untuk production penuh:

- upload file sebaiknya dipindah ke object storage/CDN sungguhan
- token auth frontend masih memakai `localStorage`
- monitoring production sebaiknya disambungkan ke layanan observability eksternal

## Arah Produk

Pengembangan Sheep-In diarahkan ke UX berbasis workflow lapangan, termasuk event-based recording untuk:

- sakit
- kawin
- bunting
- beranak
- mati
- terjual

## Lisensi

Belum ditetapkan.
