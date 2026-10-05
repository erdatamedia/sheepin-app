# Redesain mobile-first + login peternak dengan no. HP + PIN

Repo: [erdatamedia/sheepin-app](https://github.com/erdatamedia/sheepin-app). Branch `feat/auth-phone-pin-ui` → `main`.
Branch ini **sudah mencakup** `feat/ui-mobile-first`, `feat/auth-hardening`, dan `feat/auth-phone-pin`; PR lama itu bisa ditutup setelah ini di-merge.

## Ringkasan
1. **Redesain UI mobile-first** (fase 1–6): design token, bottom navigation, rekording cepat satu layar, daftar/detail ternak, peta dengan bottom sheet, panel evaluasi, dasbor, login, profil, lokasi, landing.
2. **A1 Pengerasan auth:** rate limit (`@nestjs/throttler`), `JWT_SECRET` wajib (tanpa nilai bawaan), pesan gagal seragam, `seed:admin` tidak menimpa kata sandi, CORS opsional lewat env.
3. **A2 Skema:** `User.phone` unik + kolom `pinHash`, `failedPinAttempts`, `lockedUntil`, `pinChangedAt`, `mustChangePin`; skrip `phones:normalize` (dry-run default).
4. **A3 Backend:** `POST /auth/login-phone`, `/auth/change-pin`, register dengan HP + PIN; petugas: `POST /farmers` dan `/farmers/:id/reset-pin`; kunci akun 15 menit setelah 5 kali salah; token lama dicabut saat PIN berubah.
5. **A4 Frontend:** login/daftar dengan HP + PIN, layar wajib ganti PIN sementara, profil, dan alur petugas (daftarkan peternak, badge status PIN, reset PIN dengan dialog tampil sekali).

## Perubahan yang perlu diperhatikan
- **Login peternak berubah** dari kode `FRMxxx` menjadi no. HP + PIN. ID lama tetap ada sementara **hanya untuk akun yang belum punya PIN** (panel lipat di halaman login).
- PIN awal peternak lama **hanya lewat petugas** (PIN sementara, wajib diganti). Akun tanpa PIN tidak bisa menetapkan PIN sendiri.
- Peternak tidak bisa mengganti no. HP sendiri (identitas login); hanya petugas.
- Pesan gagal login sama untuk semua kasus (nomor tidak terdaftar, PIN salah, terkunci).
- Backend menolak start bila `JWT_SECRET` kosong/pendek.
- Frontend memakai `NEXT_PUBLIC_API_URL`, fallback `/api`.

## Rilis
Ikuti [docs/rollout-a5.md](docs/rollout-a5.md): backup → `pnpm phones:normalize --apply` → `./scripts/deploy.sh` → uji dari HP → serah PIN ke peternak.
**Jangan men-deploy backend tanpa frontend** (dan sebaliknya): pendaftaran memerlukan kedua sisi.

## Pengujian
- Backend: `lint`, `nest build`, **91 unit test**, **4 smoke test** lolos.
- Frontend: `lint` dan `build` lolos (16 halaman).
- Migrasi dilatih di database sementara (urutan normalisasi → migrasi, data kotor ditolak tanpa mengubah data).
- Dicek di browser 360px: `/login` dan `/register-farmer` (tanpa overflow, validasi PIN, penyaringan input).
- **Belum diuji visual:** halaman di balik login (dasbor, ternak, rekording, peta, peternak, dialog PIN). Mohon dicoba dari HP, peran peternak dan petugas.

## Di luar cakupan
- Peta publik di landing page masih menampilkan nama peternak dan koordinat presisi (perlu keputusan).
- Penghapusan login ID lama dan kolom `loginCode` (rilis berikutnya, setelah semua peternak punya PIN).
- OTP WhatsApp untuk lupa PIN.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
