# Redesain UI mobile-first (feat/ui-mobile-first → main)

Repo: [erdatamedia/sheepin-app](https://github.com/erdatamedia/sheepin-app) (GitHub). Repo di `git.brin.go.id` hanya untuk pengumpulan administrasi.

Merapikan seluruh tampilan frontend agar mobile-first dan mudah dipakai peternak di kandang. Hanya folder `frontend/` yang berubah; tidak ada perubahan API, skema Prisma, maupun backend.

## Ringkasan per fase

| Fase | Commit | Isi |
|---|---|---|
| 1 Fondasi | `368ee6a` | Design token (warna, status, radius, bayangan) + komponen `Select`, `Skeleton`, `EmptyState`, `PageHeader`; `Button` ukuran `lg`; input 16px |
| 2 Navigasi | `2bcc53f` | Bottom nav 5 kolom + lembar "Lainnya", header ringkas mobile, sidebar tetap di desktop, safe-area iOS |
| 3 Quick Recording | `c3f98e6` | Satu layar, input bobot besar, BCS dan kesehatan sebagai segmented control, tombol simpan menempel di atas bottom nav |
| 4a Daftar ternak | `3fea81b` | Kartu ringkas, filter dapat dilipat, `AddSheepForm` bersama, foto dari kamera atau galeri |
| 4b Detail ternak | `9c500b2` | Hero, ringkasan 2x2, tab dengan `tablist`, form berlabel, toast |
| 5 Peta & evaluasi | `24c877a` | Tinggi peta responsif, bottom sheet menggantikan popup, panel evaluasi dengan skor /100 |
| 6a Dasbor, riwayat, peternak | `af5b37e` | Dasbor dirapikan, filter chip, daftar dan detail peternak |
| 6b Login, profil, lokasi, landing | `c02a890`, `de6030e` | `AuthShell`, form sungguhan, lokasi dengan tombol GPS, landing mobile |

## Perbaikan bug yang ikut masuk
- `RoleGuard` memanggil `getMe()` pada setiap render halaman (array `allowedRoles` baru tiap render), termasuk tiap ketikan di kolom pencarian.
- "Hari ini" dihitung dengan UTC, sehingga pukul 00.00–07.00 WIB memakai tanggal kemarin. Kini memakai `todayLocal()`.
- Badge status bibit menampilkan teks mentah `LAYAK_BIBIT`; kini berlabel Indonesia.
- Bobot dengan koma desimal ("32,5") kini diterima.
- Form login petugas tidak lagi mengisi otomatis `admin@sheepin.local` / `admin123`.

## Perubahan perilaku yang perlu diperhatikan
- Riwayat, Peternak, dan Lokasi ada di balik menu "Lainnya" pada bottom nav mobile (batas 5 kolom).
- `alert()` diganti pesan inline atau toast; `window.confirm` untuk hapus dipertahankan.
- `Button` kini default `type="button"` (tidak ada `<form>` lama yang terpengaruh).
- Halaman detail ternak: blok "Akses Peternak" dihapus karena tidak pernah tampil.
- Form login dan daftar kini `<form>`, jadi Enter mengirim.

## Pengujian
- `pnpm lint` dan `pnpm build` lolos di setiap commit.
- Dicek manual di 360px (`next start`): `/login`, `/`, `/register-farmer` tanpa overflow horizontal.
- **Belum diuji visual:** halaman di balik login (butuh backend dan database). Mohon dicoba di HP, peran peternak dan admin: rekording cepat, daftar dan detail ternak, peta, dasbor.

## Di luar cakupan
Perbaikan keamanan (cookie httpOnly, PIN peternak, rate limiting) sebaiknya di branch terpisah. Kata sandi seed admin perlu diganti sebelum produksi.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
