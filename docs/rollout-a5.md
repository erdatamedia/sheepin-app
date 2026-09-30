# Rilis A5: login no. HP + PIN ke server

Cakupan rilis (branch `feat/auth-phone-pin-ui`, atau `main` setelah di-merge): redesain UI mobile-first,
pengerasan auth (rate limit, `JWT_SECRET` wajib), skema PIN + no. HP unik, login no. HP + PIN, reset PIN oleh petugas.

**Lakukan di jam sepi. Perkiraan waktu: 20–30 menit. Jangan lompati urutan.**
Perintah dijalankan di server, di folder `/srv/sheepin-app`.

---

## 0. Prasyarat (sekali cek, tanpa mengubah apa pun)

- [ ] `JWT_SECRET` sudah ada di `backend/.env`, panjang 64 (sudah dilakukan sebelumnya):
  ```bash
  grep '^JWT_SECRET=' backend/.env | cut -d= -f2- | tr -d '"' | awk '{print length}'
  ```
- [ ] nginx `location /api/` untuk `sheep-in.com` meneruskan `X-Forwarded-For` (sudah dicek).
- [ ] **Cek apakah ada CDN/proxy lain di depan nginx** (mis. Cloudflare). Aplikasi memakai `trust proxy = 1`
  (satu perantara). Bila ada dua perantara, semua pengguna tampak berasal dari IP yang sama dan berbagi batas login.
  ```bash
  curl -sI https://sheep-in.com | grep -i -E "^(server|cf-ray|via|x-served-by)"
  ```
  Hanya `server: nginx` = aman. Ada `cf-ray` atau `via` = **berhenti dan kabari** agar `trust proxy` disesuaikan.
- [ ] Ruang memori cukup untuk build (`free -h`, kolom `available` > 1,5 GB).
- [ ] PR sudah di-merge ke `main`, **atau** kamu memutuskan men-deploy langsung dari branch (ganti `main` di bawah dengan nama branch).

## 1. Catat titik kembali (untuk rollback)

```bash
git rev-parse HEAD > ~/rollback-commit-$(date +%F).txt && cat ~/rollback-commit-$(date +%F).txt
pm2 list | grep sheepin
```

## 2. Backup (jangan dilewati)

```bash
cp -r backend/uploads ~/backup-uploads-$(date +%F-%H%M) && cp backend/.env ~/backup-backend-env-$(date +%F-%H%M)
```
```bash
pg_dump "$(grep '^DATABASE_URL' backend/.env | cut -d= -f2- | tr -d '"' | cut -d'?' -f1)" > ~/backup-db-$(date +%F-%H%M).sql
```
```bash
ls -lh ~/backup-db-$(date +%F)*.sql && head -3 ~/backup-db-$(date +%F)*.sql
```
Ukuran harus > 0 dan baris pertama `-- PostgreSQL database dump`.

## 3. Tarik kode (belum ada yang di-restart)

```bash
git fetch origin && git checkout main && git pull --ff-only origin main
```
(Bila deploy dari branch: `git checkout feat/auth-phone-pin-ui && git pull --ff-only origin feat/auth-phone-pin-ui`.)

## 4. Persiapan data nomor HP (SEBELUM migrasi)

Pasang dependensi dan generate klien Prisma dulu, karena skrip ada di kode baru:
```bash
cd backend && pnpm install --frozen-lockfile && pnpm prisma:generate
```
Dry-run (hanya melapor):
```bash
pnpm phones:normalize
```
Baca laporannya:
- "Tidak valid: 0" dan "Ganda setelah normalisasi: 0" → lanjut.
- Ada nomor tidak valid/ganda → **berhenti**. Kirim laporannya (nomor sudah disamarkan) untuk diperbaiki manual.

Terapkan:
```bash
pnpm phones:normalize --apply && cd ..
```
Sebelumnya tercatat 3 peternak, semuanya punya nomor unik, jadi seharusnya lancar.

## 5. Deploy (migrasi + build + reload)

`deploy.sh` idempoten: mengulang pull/install/generate, lalu menjalankan **migrasi PIN**, build backend dan frontend, dan me-reload hanya `sheepin-backend` dan `sheepin-frontend`.
```bash
./scripts/deploy.sh main
```
Yang diharapkan di log:
- `db:migrate:deploy` → `20260930170000_add_pin_auth_fields` diterapkan.
- Build backend dan frontend sukses (16 halaman).
- `pm2 reload sheepin-backend` dan `sheepin-frontend` → `✓`.

**Bila migrasi gagal karena indeks unik `User_phone_key`:** ada nomor ganda yang lolos. Aplikasi lama tetap berjalan (belum di-reload). Kirim pesan errornya; jangan menghapus data manual.

## 6. Verifikasi teknis

```bash
pm2 list | grep sheepin && curl -s http://localhost:8000/api/pemantauan/status
```
Kedua proses `online`, uptime kecil, status `sehat`.

Cek bahwa rahasia lama tidak berlaku dan tanpa token ditolak:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/auth/me
```
Harus `401`.

## 7. Uji dari HP (± 10 menit)

**Petugas/admin**
- [ ] Login email + kata sandi → dasbor tampil.
- [ ] Menu Peternak: tiga peternak tampil dengan badge **"Belum ada PIN"**.
- [ ] Buka satu peternak → **Buat PIN** → dialog PIN sementara muncul → catat.

**Peternak uji coba** (jangan pakai akun peternak sungguhan untuk uji kunci)
- [ ] Petugas: **Daftarkan Peternak** dengan nomor HP milik sendiri → catat PIN sementara.
- [ ] Login nomor HP + PIN sementara → otomatis ke halaman **Buat PIN Baru** (tidak bisa membuka halaman lain).
- [ ] Buat PIN baru (coba `123456` → harus ditolak; lalu PIN kuat) → masuk dasbor.
- [ ] Keluar, login lagi dengan PIN baru → berhasil. Dengan PIN sementara lama → gagal.
- [ ] Salah PIN 5 kali → pesan tetap sama, lalu benar-benar terkunci 15 menit (PIN benar pun ditolak).
- [ ] Rekording cepat: simpan satu bobot → berhasil.
- [ ] Setelah selesai: hapus akun uji lewat **Hapus Peternak** (di detail peternak).

**Batas percobaan**
- [ ] Tekan Masuk dengan PIN salah lebih dari 10 kali dalam semenit → muncul pesan berbahasa Indonesia ("Terlalu banyak percobaan…"), bukan teks Inggris.

## 8. Serahkan PIN ke peternak sungguhan

Untuk tiap dari 3 peternak: petugas membuka detail → **Buat PIN** → sampaikan PIN sementara **langsung** (tatap muka/telepon, bukan grup). Peternak login dengan nomor HP + PIN sementara lalu membuat PIN sendiri.

- [ ] Peternak 1 · [ ] Peternak 2 · [ ] Peternak 3
- [ ] Menu Peternak menampilkan badge **"PIN aktif"** untuk ketiganya.

Selama badge masih "Belum ada PIN", peternak itu masih bisa masuk dengan ID lama (`FRM…`) lewat panel lipat di halaman login.

## 9. Ganti kata sandi admin (bila masih bawaan)

Coba login admin dengan kata sandi `admin123`. **Bila berhasil, wajib diganti:**
```bash
cd backend && read -rs ADMIN_PASSWORD && export ADMIN_PASSWORD && pnpm seed:admin --reset-password; unset ADMIN_PASSWORD; cd ..
```
(Ketik kata sandi baru saat diminta; tidak tampil di layar. Login lama ditolak, jadi sesi admin keluar.)

## 10. Penutupan masa transisi (rilis berikutnya, setelah langkah 8 tuntas)

Ketika ketiga peternak berstatus "PIN aktif", jalur ID lama tidak bisa dipakai siapa pun lagi (hanya akun tanpa PIN yang boleh).
Rilis kecil berikutnya menghapus endpoint `/auth/login-farmer`, panel "ID lama" di halaman login, dan kolom `loginCode`.
Jangan dihapus sebelum semua peternak (termasuk yang mendaftar kemudian lewat petugas) sudah punya PIN.

---

## Rollback

Kode saja (data tetap). Jangan pakai `deploy.sh` untuk ini karena ia men-checkout branch; lakukan manual:
```bash
git checkout $(tail -1 ~/rollback-commit-*.txt)
```
```bash
(cd backend && pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build) && (cd frontend && pnpm install --frozen-lockfile && pnpm build)
```
```bash
pm2 reload sheepin-backend && pm2 reload sheepin-frontend
```

Catatan rollback:
- Kolom PIN dan indeks unik nomor HP **tidak mengganggu** kode lama (kode lama tidak memakai kolom itu).
- Kode lama **membuka kembali** login tanpa PIN via ID `FRM…` untuk semua peternak. Gunakan rollback hanya bila perlu, dan perbaiki maju secepatnya.
- Restore database dari backup (`psql < backup.sql`) hanya bila data rusak. Semua data yang dibuat setelah backup akan hilang.

## Ringkasan risiko dan penangkalnya

| Risiko | Penangkal |
|---|---|
| Nomor HP ganda menggagalkan indeks unik | Dry-run + `--apply` menolak bila ganda; migrasi belum menyentuh proses yang berjalan |
| Semua pengguna berbagi batas login (IP proxy) | Cek `X-Forwarded-For` dan CDN di langkah 0 |
| Peternak terkunci dari akun | Petugas bisa reset PIN kapan saja; ID lama tetap berlaku untuk akun tanpa PIN |
| Data hilang | Backup DB + uploads + `.env` di langkah 2 |
| Backend menolak start | `JWT_SECRET` sudah diverifikasi ada (langkah 0) |
