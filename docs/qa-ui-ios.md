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
