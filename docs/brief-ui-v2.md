# Brief Claude Code v2: Sheep-In Disederhanakan (Mobile-First, Fokus Perkembangan Ternak, Login No. HP + PIN)

Versi ini menggantikan brief sebelumnya. Salin "Prompt awal" ke Claude Code dan simpan "CLAUDE.md" di root repo.

## Arah produk (ringkas)
1. Peternak harus langsung paham alur pengisian tanpa membaca panduan.
2. Fokus utama aplikasi: perkembangan setiap ternak (bobot, kondisi tubuh, kesehatan, reproduksi) yang mudah dilihat dari waktu ke waktu.
3. Identitas peternak hanya nomor HP, diamankan dengan PIN.
4. Data wajib seminimal mungkin. Isian lain opsional.

## Keputusan yang perlu Anda tetapkan (default usulan di kanan)
| Keputusan | Default usulan |
| --- | --- |
| Cara daftar peternak | Peternak daftar sendiri (no. HP + nama + PIN); petugas juga bisa mendaftarkan |
| PIN | 6 digit, disimpan sebagai hash (bcrypt), bukan teks biasa |
| Lupa PIN | Tahap awal: direset petugas/admin. Tahap lanjut: OTP WhatsApp |
| Percobaan salah | Batasi (rate limit per no. HP dan per IP) + kunci sementara setelah 5 kali salah |
| Kode lama (FRM001 dst.) | Dipertahankan sementara untuk migrasi, lalu dihapus setelah semua peternak punya no. HP |
| Admin dan petugas | Tetap email + password |

## Prompt awal (tempel ke Claude Code)

```
Kamu bekerja di repo Sheep-In (monorepo: backend NestJS 11 + Prisma 7 + PostgreSQL, frontend Next.js 16 App Router + React 19 + Tailwind v4 + Leaflet).

Arah baru produk:
- Peternak mudah memahami alur pengisian; UI sederhana, bahasa Indonesia yang ringan, mobile-first (mulai 360px).
- Fokus pada perkembangan tiap ternak, bukan sekadar tabel data.
- Identitas peternak hanya nomor HP + PIN (menggantikan loginCode).
- Field wajib seminimal mungkin.

Langkah 0 (sebelum mengubah apa pun):
- Buat git tag `v1.0-haki` pada commit saat ini sebagai penanda versi yang dipakai untuk pendaftaran HAKI.
- Baca seluruh alur auth (backend/src/auth, users, guard, frontend/src/lib/auth.ts, halaman login/register) dan semua halaman frontend.
- Jalankan dev server, periksa tiap halaman di 360/390/768px.
- Keluarkan laporan audit + rencana fase, lalu TUNGGU persetujuan saya. Jangan edit kode dulu.

Rencana fase yang saya harapkan (boleh kamu sesuaikan setelah audit):

Fase A: Auth no. HP + PIN (branch feat/auth-phone-pin, backend + frontend)
- Migrasi Prisma: User.phone (unik, dinormalisasi ke format 62xxxxxxxxxx), pinHash, failedPinAttempts, lockedUntil. loginCode dibiarkan nullable sementara.
- Endpoint: register peternak (phone, nama, PIN), login peternak (phone, PIN), ubah PIN, reset PIN oleh petugas/admin.
- Pakai @nestjs/throttler untuk rate limit login/register, kunci sementara setelah 5 kali salah, pesan error yang tidak membocorkan apakah nomor terdaftar.
- Validasi nomor HP Indonesia dan PIN 6 digit di DTO dan di form.
- Jangan tampilkan no. HP atau data pribadi di endpoint publik (peta landing).
- Tambahkan test untuk alur register/login/lockout.

Fase B: Fondasi UI (branch feat/ui-mobile-first)
- Design tokens di globals.css, komponen dasar (Button, Input, Select, Card, Badge, EmptyState, Skeleton, PageHeader).

Fase C: Navigasi
- Bottom navigation di mobile (Beranda, Ternak, Catat, Peta, Profil), sidebar hanya di desktop.

Fase D: Perkembangan ternak (inti aplikasi)
- Beranda peternak = daftar ternaknya dengan ringkasan status (bobot terakhir, tren naik/turun, kesehatan, kapan terakhir dicatat).
- Halaman detail ternak = linimasa perkembangan: grafik bobot, riwayat kondisi tubuh, kesehatan, reproduksi, dalam bahasa sederhana.
- Ajakan aksi jelas: "Catat perkembangan hari ini".

Fase E: Pencatatan terpandu
- Ganti form panjang dengan wizard 2-3 langkah (pilih ternak, isi bobot/kondisi/kesehatan, konfirmasi).
- Hanya bobot yang dianjurkan; sisanya opsional.
- Istilah teknis diberi padanan awam dan bantuan singkat (contoh: BCS = "Kondisi tubuh 1-5" dengan penjelasan tiap skor).
- Tombol simpan menempel di bawah, input angka besar, dukung unggah foto dari kamera.

Fase F: Peta, evaluasi, polesan
- Tinggi peta responsif, bottom sheet untuk detail, kartu skor bibit yang mudah dibaca.
- State loading/kosong/error, aksesibilitas, pengecekan akhir semua lebar layar.

Aturan umum:
- Satu branch per topik, satu commit per fase, berhenti untuk konfirmasi di akhir tiap fase.
- Setelah tiap fase jalankan lint dan build (backend dan frontend) dan pastikan lolos.
- Perubahan backend hanya di Fase A; fase lain hanya frontend.
```

## CLAUDE.md (simpan di root repo)

```markdown
# Sheep-In

Platform rekording dan pemantauan perkembangan ternak domba berbasis web. Pengguna utama: peternak (FARMER) yang bekerja di kandang, petugas lapangan (OFFICER), dan ADMIN.

## Stack
- Backend: NestJS 11, Prisma 7 (@prisma/adapter-pg), PostgreSQL. Prefix API: /api
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, Axios, Leaflet (dimuat dinamis, ssr: false), Lucide Icons
- Package manager: pnpm

## Prinsip produk
- Peternak harus paham alurnya tanpa panduan. Kurangi langkah, kurangi istilah teknis.
- Fokus pada perkembangan tiap ternak dari waktu ke waktu.
- Identitas peternak: nomor HP + PIN (6 digit, disimpan sebagai hash). Jangan meminta data identitas lain.
- Field wajib seminimal mungkin; sisanya opsional.

## Prinsip UI
- Mobile-first mulai 360px. Aksi utama (catat perkembangan, tambah ternak) maksimal 2 ketuk dari beranda.
- Tap target minimal 44x44px, teks isi minimal 16px, input angka memakai inputMode numeric/decimal.
- Tidak ada overflow horizontal. Tabel menjadi kartu di layar kecil.
- Bahasa antarmuka: Bahasa Indonesia sederhana.
- Selalu ada state loading (skeleton), kosong (EmptyState + ajakan aksi), dan error (pesan jelas + coba lagi).
- Palet: hijau hutan #21493d, krem #f3efe6, border rgba(109, 93, 66, 0.14). Gunakan token di globals.css.

## Keamanan dan privasi
- Nomor HP adalah data pribadi (UU PDP No. 27/2022): jangan tampilkan di endpoint atau halaman publik, jangan masukkan ke log.
- Endpoint login/register wajib rate limit; pesan error tidak boleh membocorkan apakah nomor terdaftar.
- Jangan simpan PIN atau token di log. Hash PIN dengan bcrypt.

## Aturan kerja
- Sebelum commit: lint dan build backend + frontend harus lolos.
- Komponen Leaflet tetap dimuat dengan next/dynamic (ssr: false).
- Versi yang didaftarkan ke DJKI ditandai tag git `v1.0-haki`; jangan ubah tag itu.
```

## Dampak ke dokumen HAKI dan manual book
Login peternak berubah dari kode unik ke no. HP + PIN, sehingga bagian berikut perlu disesuaikan bila dokumen diperbarui atau diajukan ulang:
- Alur autentikasi (flowchart `alur_autentikasi`) dan bagian "cara penggunaan" di manual book
- Tabel KI: modul input eksternal dan logika terkait registrasi/login peternak
- Deskripsi aplikasi dan keunggulan (penyebutan "login berbasis kode unik")
- ERD (penambahan kolom phone, pinHash, dan sejenisnya)

Tanda `v1.0-haki` menjaga agar versi yang sudah didaftarkan tetap bisa dirujuk.
