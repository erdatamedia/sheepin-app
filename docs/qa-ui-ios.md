# Uji tampilan: tema iOS coklat pastel

Uji di HP (atau browser lebar 360px, 390px, 768px). Peran: **peternak** dan **petugas/admin**.
Tandai hasil; catat nomor baris dan layar yang bermasalah.

## Umum (semua halaman)
- [ ] Tidak ada geser horizontal di halaman mana pun (360px).
- [ ] Teks terbaca jelas di atas latar krem; tidak ada sisa warna hijau lama.
- [ ] Bilah tab bawah: 5 tab, tab aktif berwarna coklat dan ikon lebih tebal; tidak menutupi tombol atau isi paling bawah.
- [ ] Di iPhone: area bawah aman (tidak tertimpa garis home), bilah tab tembus pandang samar.
- [ ] Mengetuk kolom isian **tidak** memperbesar layar sendiri (teks isian 17px).

## Peternak
**Beranda**
- [ ] "Halo, Nama", tombol besar *Catat perkembangan hari ini*, tiga ringkasan (aktif, sakit, bunting).
- [ ] *Perlu perhatian* hanya muncul bila ada ternak sakit, bunting, atau belum dicatat 14 hari.
- [ ] Baris ternak: bobot terakhir + tanda ▲/▼, "dicatat … lalu", badge kesehatan.
**Ternak**
- [ ] Pilihan *Aktif / Semua* bekerja; pencarian bekerja; *Tambah* membuka lembar dari bawah.
**Detail ternak**
- [ ] Grafik bobot: sentuh/geser menggeser titik terpilih dan angka besar ikut berubah; halaman tetap bisa digulir vertikal.
- [ ] Linimasa: filter jenis, pengelompokan per bulan, *Tampilkan lebih banyak*.
- [ ] *Catat kejadian* membuka halaman Catat dengan kejadian sudah terpilih.
**Catat**
- [ ] Dari detail ternak: langsung ke langkah 2. Dari tab Catat: mulai di langkah 1 (atau langkah 2 bila hanya 1 ternak).
- [ ] Bobot "32,5" (koma) diterima; "abc" tidak bisa diketik; 999 ditolak dengan pesan.
- [ ] *Apa artinya?* membuka lembar panduan kondisi tubuh; bisa ditutup dengan X, ketuk luar, dan tombol *Mengerti*.
- [ ] Tombol *Lanjut* nonaktif saat semua kosong, ada petunjuknya.
- [ ] Langkah 3 menampilkan ringkasan; *Ubah* kembali; *Simpan* menampilkan layar *Tersimpan*.
- [ ] Setelah simpan, catatan muncul di linimasa detail ternak.
**Akun**
- [ ] Daftar berkelompok; *Data profil*, *Lokasi kandang*, *Ganti PIN*, *Keluar* bekerja.

## Petugas / admin
- [ ] Tab keempat adalah **Peta**; Riwayat dan Peternak ada di **Akun → Kelola**.
- [ ] Ternak: filter membuka lembar; *Lihat N ternak* menutupnya.
- [ ] Peternak: badge *Belum ada PIN / PIN sementara / PIN aktif*; *Daftarkan* membuka lembar; PIN sementara tampil di lembar dan bisa disalin.
- [ ] Detail peternak: *Buat/Reset PIN*, *Hubungi* (membuka telepon), *Buka rute* (Google Maps), *Ubah data* (lembar; ada tombol hapus).
- [ ] Peta: ketuk marker membuka lembar detail di dalam peta; *Wilayah* membuka filter; tinggi peta nyaman di layar kecil.
- [ ] Detail ternak: *Input manual (petugas)* bisa dibuka dan semua formulir lama tetap berfungsi.

## Kondisi khusus
- [ ] Matikan internet lalu buka Beranda, Ternak, Peta, Akun, Catat: muncul *Gagal memuat* dengan tombol *Coba lagi* (bukan "belum ada data").
- [ ] Akun tanpa ternak: ajakan *Tambah ternak* (bukan layar kosong).
- [ ] Pembaca layar (VoiceOver/TalkBack): judul halaman dibaca; tombol ikon punya nama; arah tren dibaca "naik/turun".
- [ ] Pengaturan "kurangi gerakan" aktif: lembar tidak beranimasi.

## Kaca (glassmorphism)
- [ ] Latar menampakkan bercak warna (coklat susu, karamel, krem), bukan satu warna rata, dan tidak ikut tergulir.
- [ ] Kartu, daftar, bilah tab, dan lembar tampak seperti kaca buram: isi di belakangnya samar terlihat saat digulir.
- [ ] Teks di atas kaca tetap jelas di bagian latar yang paling gelap (pojok kanan atas dan kanan tengah).
- [ ] Tombol utama bergradien coklat dengan garis terang di tepi atas; teks putih terbaca di atas maupun di bawah.
- [ ] Gulir panjang (daftar ternak, linimasa) tetap mulus di HP Anda. Bila tersendat, catat tipe HP-nya.
- [ ] Pengaturan "kurangi transparansi" aktif: panel berubah solid, tetap terbaca.

## Foto ternak dan form (perbaikan dari uji lapangan)
- [ ] **Keyboard tetap muncul** saat mengetik di form *Tambah ternak*, *Daftarkan peternak*, dan *Ubah data peternak*: bisa mengetik beberapa huruf berturut-turut tanpa mengetuk kolom lagi.
- [ ] Halaman **Ternak**: tombol **Daftar / Foto**. Pilihan diingat setelah halaman ditutup dan dibuka lagi.
- [ ] Tampilan **Foto**: kisi 3 kolom; kode ternak besar di atas foto; penanda **Sakit** merah; ternak tanpa foto menampilkan inisial dan ikon kamera.
- [ ] Mengetuk foto membuka **layar penuh**: geser kiri-kanan (atau panah) pindah ke ternak berikutnya, angka "3 / 24" berubah, perpindahan terasa instan.
- [ ] Di layar penuh: tombol **Catat** membuka catatan ternak itu, **Detail** membuka halaman ternak, **X** menutup.
- [ ] Pencarian kode tetap bekerja di tampilan Foto (ketik "014" lalu foto yang cocok saja yang tersisa).
- [ ] Foto pertama kali dibuka mungkin sedikit lambat (dibuat miniaturnya); pembukaan berikutnya cepat.
- [ ] Detail ternak: ketuk foto bulat memperbesarnya; baris **Foto ternak → Tambah/Ganti foto** membuka kamera atau galeri.
- [ ] **Peternak** dapat menambah atau mengganti foto ternaknya sendiri (sebelumnya hanya petugas).
- [ ] Unggah foto dari kamera HP terasa cepat (foto diperkecil dulu sebelum dikirim).
- [ ] Halaman **Catat → pilih ternak** menampilkan foto kecil di samping tiap ternak.

## Foto per sudut dan ciri pembeda (opsional)
- [ ] Halaman **Catat → Pilih ternak**: tombol **Daftar / Foto** di bawah kolom cari. Di tampilan Foto, mengetuk foto langsung memilih ternak; ikon kecil di pojok kiri atas memperbesar foto, dengan tombol **Pilih ternak ini**.
- [ ] Pencarian di Ternak dan Catat juga mencocokkan **ciri** (mis. ketik "cembung" atau "tahi lalat").
- [ ] Detail ternak → **Foto dan ciri**: lima kotak (Wajah & hidung, Samping, Belakang, Telinga & tanduk, Ekor). Kotak kosong langsung membuka kamera; kotak berisi membuka menu Perbesar / Ambil foto baru / Pilih dari galeri / Hapus.
- [ ] Setelah foto **Wajah & hidung** diisi, foto itulah yang tampil sebagai pratinjau utama di daftar, kisi foto, beranda, dan pilih ternak.
- [ ] Ternak lama yang hanya punya satu foto: foto itu tetap tampil sebagai wajah & hidung.
- [ ] Menghapus foto wajah: pratinjau pindah ke sudut foto berikutnya, atau kosong bila tidak ada.
- [ ] Pelihat layar penuh: **geser kiri-kanan** = sudut foto lain dari ternak yang sama (label sudut di atas foto dan deretan tombol sudut di bawah); **geser atas-bawah** atau tombol panah di bilah atas = ternak berikutnya/sebelumnya.
- [ ] Ciri pembeda: baris **Wajah dan hidung / Telinga dan tanduk / Ekor dan postur / Tanda khusus** membuka lembar isian; ketuk saran untuk mengisi cepat; kosongkan isian lalu simpan untuk menghapus.
- [ ] Ciri yang terisi tampil di pelihat foto, di bawah nama ternak.
- [ ] Isi semua opsional: ternak tanpa ciri dan tanpa foto sudut tetap bekerja seperti biasa.

## Navigasi mengambang dan pasang ke layar utama

- [ ] Bilah bawah berupa kapsul kaca yang mengambang (ada jarak ke tepi layar dan ke bawah), tidak menutupi konten terakhir di halaman mana pun.
- [ ] Tombol **Catat** di tengah lebih besar dan menonjol di atas kapsul; ketuk membuka rekording; tampil ring saat aktif.
- [ ] Di halaman Catat, tombol Simpan berada di atas bilah dan tidak tertimpa tombol Catat; toast tidak tertutup bilah.
- [ ] iPhone dengan home indicator: jarak bawah aman (tidak menempel).
- [ ] **Android (Chrome):** di Beranda muncul ajakan "Pasang di layar utama"; ketuk **Pasang** memunculkan dialog pasang bawaan; setelah terpasang ajakan hilang.
- [ ] **iPhone (Safari):** ketuk **Pasang** menampilkan langkah Bagikan → Tambah ke Layar Utama; setelah ditambahkan, ikon domba tampil dan app terbuka layar penuh ke Beranda.
- [ ] Ajakan tidak tampil di desktop maupun saat dibuka dari layar utama; tombol ✕ menyembunyikannya 14 hari.
- [ ] Akun → **Pasang di layar utama** membuka panduan yang sama; baris hilang bila sudah terpasang.

## Apresiasi: kartu digital dan prestasi

- [ ] Detail ternak → **Kartu digital**: pratinjau muncul; ganti periode (30/90/Semua) memperbarui PBBH, selisih bobot, dan grafik; centang "Tampilkan nama peternak" menambah/menghapus baris peternak.
- [ ] Ternak tanpa foto memakai domba garis; foto wajah dipakai bila ada. Ternak dengan <2 timbangan menampilkan "butuh 2 timbangan".
- [ ] **Bagikan** membuka lembar bagikan HP (WhatsApp, dll.) dengan gambar; di laptop tombol berganti **Unduh gambar**.
- [ ] Peternak: Beranda atau Akun → **Prestasi saya**: runtun, ubin ringkasan, 8 lencana dengan kemajuan, pertumbuhan terbaik.
- [ ] Ubah periode (tanggal atau 30 hari/90 hari/1 tahun) memperbarui angka dan lencana.
- [ ] **Bagikan rapor** menghasilkan kartu peternak; periksa tidak ada nomor HP, alamat lengkap, atau koordinat pada kartu.
- [ ] Catat satu timbangan hari ini lalu buka Prestasi: runtun bertambah. Tidak mengisi hari ini tidak memutus runtun sampai besok.
