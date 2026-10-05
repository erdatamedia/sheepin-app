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

## Tentang ternak (opsional) saat tambah dan oleh peternak

- [ ] Tambah ternak: bagian **Tentang ternak ini** tertutup secara bawaan; membuka menampilkan tanggal lahir, warna, lokasi/kandang, pejantan, dan induk. Simpan tanpa mengisinya tetap berhasil.
- [ ] Isi sebagian lalu simpan: data tampil di detail ternak; kolom yang dikosongkan tidak menimbulkan galat (tidak ada "birthDate must be a valid ISO 8601").
- [ ] Peternak: detail ternak → baris **Tentang ternak ini** bisa diketuk, lembar terbuka; ubah tanggal lahir, warna, lokasi, pejantan, induk lalu simpan; muncul toast "tersimpan".
- [ ] Mengosongkan isian lalu simpan menghapus nilainya (baris kembali "Belum diisi"). Mengosongkan Jenis / rumpun ditolak.
- [ ] Peternak tidak bisa mengubah ternak milik peternak lain (API 403).

## Katalog ternak dari peta

- [ ] Peta (petugas/admin): ketuk titik → panel punya **Lihat Katalog Ternak** → halaman `/catalog/<id>` menampilkan kisi foto ternak peternak itu; ketuk kartu membuka detail ternak. Tombol kembali ke Peta.
- [ ] Filter katalog: pencarian (kode/nama/jenis), Jantan/Betina, dan status (Aktif/Terjual/Mati/Afkir) bekerja; ternak tanpa foto menampilkan ikon domba.
- [ ] Peta publik di landing: ketuk titik → **Lihat Katalog Ternak** → `/katalog/<id>` tanpa login: hanya ternak aktif, tanpa nomor HP, ciri, atau catatan kesehatan; kartu tidak bisa diketuk ke detail.
- [ ] `/katalog/<id>` dengan id yang tidak ada (atau peternak tanpa titik peta) menampilkan "Katalog tidak ditemukan".
- [ ] Kisi 2 kolom di HP, 3 di tablet, 4-5 di laptop; tidak ada overflow horizontal.

## Umur opsional di Catat

- [ ] Catat → Perkembangan: urutan kartu Bobot, **Umur (opsional)**, Kondisi tubuh, Kesehatan.
- [ ] Ternak tanpa tanggal lahir: kolom umur bisa diisi (bulan). Simpan hanya umur + bobot berhasil; detail ternak kini menampilkan tanggal lahir perkiraan (tanggal catat dikurangi umur).
- [ ] Ternak yang sudah punya tanggal lahir: kolom umur terkunci dan menampilkan umur dari tanggal lahir, dengan keterangan; tanggal lahir lama tidak tertimpa.
- [ ] Mengosongkan umur tidak mengubah apa pun. Angka di atas 240 atau desimal ditolak dengan pesan; ringkasan sebelum simpan menampilkan baris Umur bila ada.

## Kode ternak unik per peternak

- [ ] Dua peternak berbeda boleh memberi kode yang sama (mis. "001") pada ternaknya masing-masing; tidak ada galat.
- [ ] Peternak yang sama memakai kode yang sudah ada (termasuk beda huruf besar/kecil, mis. "jm" vs "Jm") ditolak dengan pesan "Anda sudah punya ternak dengan kode itu...", bukan "terjadi kesalahan pada server".
- [ ] Spasi di awal/akhir kode dibuang; kode hanya spasi ditolak.
- [ ] Mengubah kode ternak (Ubah) ke kode yang sudah dipakai ternak lain milik pemilik sama ditolak; mengubah kolom lain tidak memeriksa kode.
- [ ] Staf melihat nama pemilik di daftar dan detail sehingga kode kembar antar-peternak tetap bisa dibedakan.

Catatan deploy: ada migrasi `20261002090000_sheep_code_unique_per_owner` (hapus indeks unik global, tambah unik pemilik+kode). Aman pada data yang ada karena kode yang sebelumnya unik global otomatis unik per pemilik. Diuji pada database cadangan berisi kode kembar antar-pemilik.

## Peternak: ubah dan hapus ternak sendiri

- [ ] Ternak (daftar): tiap baris punya tombol ⋯ (di tampilan Foto, di pojok kanan bawah kartu). Lembar aksi: Catat perkembangan, Ubah data, Hapus ternak.
- [ ] **Ubah data** membuka detail ternak dengan lembar "Ubah data ternak" (kode, jenis kelamin, nama, jenis, tanggal lahir, warna, lokasi, pejantan, induk). Simpan memperbarui tampilan; alamat kembali bersih tanpa `?aksi=`.
- [ ] Mengubah kode ke kode yang sudah dipakai ternak lain milik peternak itu ditolak dengan pesan jelas; kode kosong ditolak.
- [ ] Detail ternak (peternak): tombol **Ubah** dan **Hapus** di bawah nama.
- [ ] Hapus ternak baru (<= 7 hari) atau yang belum punya catatan: lembar konfirmasi menyebut jumlah catatan yang ikut hilang; "Ya, hapus ternak" berhasil lalu kembali ke daftar.
- [ ] Hapus ternak lama yang sudah berriwayat: tidak bisa; lembar menjelaskan dan menawarkan "Tandai terjual, mati, atau afkir".
- [ ] Peternak tidak bisa menghapus/mengubah ternak orang lain (API 403).
- [ ] Admin/petugas menghapus ternak: tidak lagi muncul "terjadi kesalahan pada server" (bug kunci asing log aktivitas).

## Katalog layak bibit terverifikasi (landing)

- [ ] Landing: tombol **Katalog** di bilah atas (HP dan laptop) dan tautan di hero membuka `/katalog` tanpa login. Di 360px bilah atas tidak meluap (teks "Sheep-In" disembunyikan di layar sangat sempit).
- [ ] `/katalog` menampilkan hanya ternak aktif yang (1) diverifikasi staf dan (2) masih layak bibit menurut sistem. Setiap kartu ada tanda **Terverifikasi**, skor, bobot, wilayah. Pencarian dan filter jenis kelamin/jenis bekerja.
- [ ] Ketuk kartu → `/katalog/ternak/<id>`: foto per sudut, bobot, BCS, skor, daftar "Mengapa layak bibit", wilayah, tanggal verifikasi dan pihak yang memverifikasi. Tidak ada nomor HP, alamat rinci, atau catatan kesehatan.
- [ ] Admin/petugas: Akun → **Verifikasi katalog**: daftar ternak layak bibit yang belum diverifikasi; **Verifikasi** memunculkannya di katalog; **Cabut** menghapusnya (ada konfirmasi).
- [ ] Ternak yang belum layak bibit tidak bisa diverifikasi (pesan jelas). Ternak yang sudah terverifikasi lalu kondisinya memburuk (mis. sakit) otomatis hilang dari katalog tanpa dicabut.
- [ ] Peta publik → titik → Lihat Katalog Ternak: hanya ternak terverifikasi; titik tanpa ternak terverifikasi menampilkan "Belum ada ternak terverifikasi".

Catatan deploy: ada migrasi `20261005090000_add_sheep_verification` (kolom verifiedAt/verifiedById/verifiedNote). Diuji pada database cadangan tanpa drift. Katalog kosong sampai ada ternak yang diverifikasi.

## Laporan berkala untuk peneliti dan dinas

- [ ] Laporan → kartu **Laporan untuk peneliti dan dinas**: **Unduh rekap Excel** mengunduh `laporan-sheepin-<tanggal>.xlsx` dengan lima lembar (Ringkasan, Peternak, Ternak, Penimbangan, Kesehatan); terbuka benar di Excel.
- [ ] Periksa isi: tidak ada nomor HP, alamat rinci, atau koordinat; kolom Ternak memuat PBBH, penilaian sistem, skor, terverifikasi, kelengkapan data.
- [ ] Tanpa SMTP di server: kartu menyatakan "Pengiriman berkala belum aktif" dan tombol Kirim sekarang tidak tampil.
- [ ] Dengan SMTP + REPORT_RECIPIENTS: kartu menampilkan jadwal, penerima, dan "berikutnya"; admin menekan **Kirim sekarang** → email dengan lampiran Excel tiba; status "Terakhir: Terkirim..." tampil. Petugas tidak melihat tombol kirim.
- [ ] Email yang salah konfigurasi menampilkan pesan galat yang jelas, bukan "terjadi kesalahan pada server".

## Panduan pertama kali (peternak)

- [ ] Beranda peternak: kartu **Baru pertama kali?** dengan tombol Mulai dan ✕; tombol **Panduan** di judul Beranda selalu ada; Akun → **Panduan penggunaan** juga memulai dari awal.
- [ ] Panduan menyorot elemen satu per satu (latar gelap dengan lubang di elemen), kartu penjelasan di bawah/atas elemen, penghitung "Langkah x dari 9". Alur: Selamat datang → menu Ternak → Tambah → Daftar/Foto → titik tiga → Catat (pilih ternak) → tombol Catat di Beranda → Prestasi → Selesai.
- [ ] Berpindah halaman otomatis (Beranda → Ternak → Catat → Beranda) dan lanjut menyorot tanpa mengulang; di HP yang disorot adalah tab bawah, di laptop item sidebar.
- [ ] Peternak tanpa ternak: langkah Daftar/Foto, titik tiga, dan pilih ternak dilewati otomatis.
- [ ] **Kembali** mundur satu langkah; **Lewati**/Escape menutup; ketukan di luar kartu tidak memicu tombol di bawahnya; **Selesai** menutup dan ajakan "Baru pertama kali?" hilang.
- [ ] Panduan bisa dimulai lagi berulang kali lewat tombol Panduan; menutup browser/tab menghentikannya.
- [ ] Admin/petugas tidak melihat panduan ini.
