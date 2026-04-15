# Sheep-In Backend

Backend Sheep-In dibangun dengan NestJS, Prisma, dan PostgreSQL.

## Menjalankan lokal

```bash
pnpm install
pnpm prisma:generate
pnpm db:migrate:dev
pnpm start:dev
```

Pastikan `.env` memuat minimal:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
MEDIA_PUBLIC_BASE_URL=https://aset.domain-anda.com
STORAGE_DRIVER=lokal
```

`MEDIA_PUBLIC_BASE_URL` dipakai agar URL file siap dipindah ke object storage atau CDN tanpa mengubah respons API.

## Migrasi produksi

Urutan yang aman dan repeatable:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm build
pnpm start:prod
```

Gunakan `pnpm db:migrate:status` sebelum deploy jika ingin memastikan seluruh migrasi sudah sinkron.

## Smoke test

```bash
pnpm test:smoke
```

Smoke test memeriksa:

- endpoint pemantauan
- login peternak
- baca profil aktif
- simpan perubahan profil
- unggah gambar

## Pemantauan dasar

- `GET /api/pemantauan/status` untuk status layanan
- log request dan error aktif secara global
- error backend dikembalikan dengan format JSON konsisten
