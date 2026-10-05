# Deploy ke VPS

Repo sumber: `git@github.com:erdatamedia/sheepin-app.git` (remote `origin` di VPS).

## Sekali saja (setup awal)

```bash
git clone git@github.com:erdatamedia/sheepin-app.git sheepin
cd sheepin
cp backend/.env.example backend/.env 2>/dev/null || nano backend/.env
nano frontend/.env.local
```

`backend/.env` (ganti semua nilai contoh):

```
PORT=8000
DATABASE_URL=postgresql://USER:PASS@localhost:5432/sheepin_db?schema=public
JWT_SECRET=<acak panjang, bukan nilai contoh>
JWT_EXPIRES_IN=7d
```

`frontend/.env.local` (opsional; dibaca **saat build**, ubah lalu build ulang). Tanpa file ini, frontend memakai `/api` sehingga reverse proxy satu domain cukup:

```
NEXT_PUBLIC_API_URL=https://DOMAIN-ANDA/api
```

Proses (contoh pm2, nama proses harus persis ini agar dikenali skrip):

```bash
cd backend  && pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm db:migrate:deploy && pnpm build
pm2 start "pnpm start:prod" --name sheepin-backend
cd ../frontend && pnpm install --frozen-lockfile && pnpm build
pm2 start "pnpm start -p 3000" --name sheepin-frontend
```

Reverse proxy (nginx/Caddy): `/api` dan `/uploads` → `localhost:8000`, sisanya → `localhost:3000`.
Seed admin hanya jika DB baru: `cd backend && pnpm seed:admin`, lalu **ganti kata sandinya**.

## Setiap update

```bash
cd sheepin && ./scripts/deploy.sh          # branch main
./scripts/deploy.sh feat/ui-mobile-first   # uji branch tertentu
```

Skrip menolak jalan jika `.env` belum ada atau ada perubahan lokal, memakai `git pull --ff-only`,
menjalankan migrasi (`db:migrate:deploy`), build backend dan frontend berurutan, lalu `pm2 reload`.

## Laporan berkala ke peneliti dan dinas (opsional)

Laporan Excel (peternak + ternak, tanpa nomor HP dan alamat rinci) bisa diunduh admin/petugas dari halaman **Laporan**.
Agar juga **dikirim otomatis lewat email**, tambahkan di `backend/.env` lalu `pm2 reload sheepin-backend`:

```
SMTP_HOST=smtp.contoh.com
SMTP_PORT=587
SMTP_USER=akun@contoh.com
SMTP_PASS=<kata sandi atau app password>
SMTP_FROM="Sheep-In <akun@contoh.com>"
REPORT_RECIPIENTS=dinas@banyuwangi.go.id,peneliti@kampus.ac.id
# opsional, bawaan: tanggal 1 tiap bulan pukul 07.00 WIB
REPORT_CRON="0 7 1 * *"
```

Tanpa SMTP_* dan REPORT_RECIPIENTS, tidak ada yang dikirim dan halaman Laporan menampilkan "belum aktif".
Tombol **Kirim sekarang** (admin) mengirim satu laporan saat itu juga untuk menguji. Log: `pm2 logs sheepin-backend | grep ReportMailService`.
Jadwal berjalan di dalam proses backend; bila backend dijalankan lebih dari satu instans, setiap instans akan mengirim (jalankan satu saja).
Gmail memerlukan "App password", bukan kata sandi akun.

## Rollback

```bash
git log --oneline -5            # cari commit sebelumnya
git checkout <sha> && ./scripts/deploy.sh main   # atau build manual
```

Migrasi database tidak otomatis mundur; cek dulu apakah rilis menambah migrasi baru.

## Catatan
- Rilis redesain UI (`feat/ui-mobile-first`) tidak mengubah backend maupun skema DB; aman tanpa migrasi baru.
- Folder `backend/uploads/` menyimpan foto; jangan dihapus dan sertakan di backup.
- `.env` dan `.env.local` tidak ikut git.
