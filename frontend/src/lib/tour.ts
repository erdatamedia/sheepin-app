/**
 * Panduan pertama kali untuk peternak: langkah demi langkah dengan sorotan pada elemen berpenanda
 * `data-tour="..."`. Status (langkah ke berapa) disimpan di sessionStorage supaya panduan lanjut
 * saat berpindah halaman; "sudah selesai" dicatat di localStorage hanya untuk menyembunyikan ajakan.
 * Panduan bisa dimulai berulang kali.
 */

export type TourStep = {
  /** Halaman tempat langkah ini tampil. */
  route: string;
  /** Nilai data-tour elemen yang disorot; kosong = kartu di tengah layar. */
  target?: string;
  title: string;
  text: string;
  /** Lewati langkah ini bila elemennya tidak ada (mis. belum punya ternak). */
  skipIfMissing?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/dashboard',
    title: 'Selamat datang di Sheep-In',
    text: 'Panduan singkat ini menunjukkan cara mengisi data pertama kali. Anda hanya melihat, tidak ada data yang tersimpan. Bisa diulang kapan saja lewat tombol Panduan.',
  },
  {
    route: '/dashboard',
    target: 'nav-sheep',
    title: '1. Mulai dari Ternak',
    text: 'Semua ternak Anda ada di menu Ternak. Daftarkan dulu ternaknya di sini sebelum mencatat bobot dan kesehatannya.',
  },
  {
    route: '/sheep',
    target: 'add-sheep',
    title: '2. Tambah ternak',
    text: 'Ketuk Tambah, lalu isi kode, jenis, dan jenis kelamin. Foto dan bagian "Tentang ternak ini" (tanggal lahir, warna, induk) boleh dilewati dan dilengkapi nanti.',
  },
  {
    route: '/sheep',
    target: 'view-toggle',
    title: '3. Daftar atau Foto',
    text: 'Pilih tampilan Foto untuk mengenali ternak dari wajahnya, atau Daftar untuk melihat bobot dan kondisinya sekilas.',
    skipIfMissing: true,
  },
  {
    route: '/sheep',
    target: 'sheep-menu',
    title: '4. Salah input?',
    text: 'Ketuk titik tiga pada ternak untuk mengubah datanya atau menghapusnya. Ternak lama yang sudah punya catatan tidak bisa dihapus, cukup tandai terjual atau mati.',
    skipIfMissing: true,
  },
  {
    route: '/recording',
    target: 'pick-sheep',
    title: '5. Catat perkembangan',
    text: 'Pilih ternak di sini, lalu isi bobot, umur (boleh perkiraan), kondisi tubuh, dan kesehatan. Cukup salah satu juga boleh. Setelah itu simpan.',
    skipIfMissing: true,
  },
  {
    route: '/dashboard',
    target: 'record-today',
    title: 'Jalan pintas mencatat',
    text: 'Dari Beranda, tombol ini langsung membuka halaman Catat. Tombol Catat di tengah menu bawah juga sama.',
  },
  {
    route: '/dashboard',
    target: 'prestasi',
    title: '6. Prestasi',
    text: 'Makin rutin Anda mengisi, makin banyak lencana dan runtun hari yang terkumpul. Dari sini Anda bisa membagikan kartu ternak dan rapor ke sesama peternak atau peneliti.',
  },
  {
    route: '/dashboard',
    title: 'Selesai',
    text: 'Anda siap mencatat. Panduan bisa diulang kapan saja lewat tombol Panduan di Beranda atau menu Akun.',
  },
];

const KEY = 'sheepin-tour';
const DONE_KEY = 'sheepin-tour-done';
const EVENT = 'sheepin:tour';

function read(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n < TOUR_STEPS.length ? n : null;
  } catch {
    return null;
  }
}

function write(index: number | null) {
  try {
    if (index === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(index));
  } catch {
    /* penyimpanan tidak tersedia: panduan tetap jalan di halaman ini */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const tourStore = {
  subscribe(callback: () => void) {
    window.addEventListener(EVENT, callback);
    return () => window.removeEventListener(EVENT, callback);
  },
  snapshot(): number | null {
    return read();
  },
  serverSnapshot(): number | null {
    return null;
  },
  start() {
    write(0);
  },
  go(index: number) {
    write(Math.max(0, Math.min(TOUR_STEPS.length - 1, index)));
  },
  finish() {
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* abaikan */
    }
    write(null);
  },
};

/** Ajakan "Baru pertama kali?" hanya sampai panduan pernah diselesaikan atau ditutup. */
export const tourPrompt = {
  subscribe(callback: () => void) {
    window.addEventListener(EVENT, callback);
    return () => window.removeEventListener(EVENT, callback);
  },
  snapshot(): boolean {
    try {
      return localStorage.getItem(DONE_KEY) !== '1';
    } catch {
      return false;
    }
  },
  serverSnapshot(): boolean {
    return false;
  },
  dismiss() {
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* abaikan */
    }
    window.dispatchEvent(new Event(EVENT));
  },
};

/** Elemen pertama yang tampil (bukan yang tersembunyi, mis. sidebar di HP) untuk data-tour tertentu. */
export function findTourTarget(target: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const node of nodes) {
    if (node.getClientRects().length > 0) return node;
  }
  return null;
}

export const NAV_TOUR_KEY: Record<string, string> = {
  '/dashboard': 'nav-home',
  '/sheep': 'nav-sheep',
  '/recording': 'nav-record',
  '/profile': 'nav-account',
};
