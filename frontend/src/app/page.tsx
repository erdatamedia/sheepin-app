import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  ChartNoAxesCombined,
  ClipboardPen,
  Download,
  MapPinned,
  Smartphone,
  UsersRound,
} from 'lucide-react';
import { buttonClassName } from '@/components/ui/button';
import { LandingDistributionSection } from '@/components/map/landing-distribution-section';
import { cn } from '@/lib/utils';

const fitur = [
  {
    icon: ClipboardPen,
    judul: 'Catat cepat di kandang',
    isi: 'Bobot, kondisi tubuh, kesehatan, dan reproduksi tersimpan sekaligus dalam satu layar.',
  },
  {
    icon: Camera,
    judul: 'Kenali ternak dari foto',
    isi: 'Foto wajah, samping, dan sudut lain, plus ciri pembeda, agar domba yang mirip tetap mudah dibedakan.',
  },
  {
    icon: ChartNoAxesCombined,
    judul: 'Evaluasi bibit',
    isi: 'Pertumbuhan dan skor kelayakan bibit terbaca jelas, lengkap dengan riwayat tiap ternak.',
  },
  {
    icon: MapPinned,
    judul: 'Sebaran peternak',
    isi: 'Petugas memantau lokasi dan populasi ternak di peta tanpa berkeliling satu per satu.',
  },
];

const langkah = [
  { judul: 'Pilih ternak', isi: 'Cari dari daftar atau ketuk fotonya.' },
  { judul: 'Isi catatan', isi: 'Bobot, kondisi tubuh, dan kesehatan hari ini.' },
  { judul: 'Simpan', isi: 'Satu ketukan, lanjut ke ternak berikutnya.' },
  { judul: 'Lihat perkembangan', isi: 'Riwayat dan evaluasi muncul otomatis.' },
];

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)} aria-label="Sheep-In, beranda">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={44}
        height={44}
        priority
        className="h-10 w-10 rounded-[12px] shadow-[var(--shadow-accent)] lg:h-11 lg:w-11"
      />
      <span className="text-xl font-semibold tracking-tight text-ink lg:text-2xl">Sheep-In</span>
    </Link>
  );
}

/** Tiruan layar Catat cepat untuk hero; hanya hiasan. */
function PhoneMock() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[19rem] lg:max-w-[22rem]">
      <div className="glass-strong rounded-[2.5rem] p-3 shadow-[0_30px_60px_rgba(94,70,50,0.28)]">
        <div className="rounded-[2rem] bg-[var(--background)] px-4 pb-4 pt-5">
          <p className="text-[13px] font-medium text-ink-muted">Catat cepat</p>
          <p className="text-2xl font-semibold tracking-tight text-ink">Domba 014</p>

          <div className="glass mt-4 rounded-[var(--radius-card)] px-4 py-3 text-center">
            <p className="text-[12px] text-ink-muted">Bobot hari ini</p>
            <p className="text-5xl font-semibold tabular-nums text-ink">
              32,5<span className="ml-1 text-lg font-medium text-ink-muted">kg</span>
            </p>
          </div>

          <p className="mb-1.5 mt-4 text-[12px] font-medium text-ink-muted">Kondisi tubuh (BCS)</p>
          <div className="glass grid grid-cols-5 gap-1 rounded-full p-1 text-center text-sm font-medium">
            {['1', '2', '3', '4', '5'].map((n) => (
              <span
                key={n}
                className={cn(
                  'rounded-full py-1.5',
                  n === '3'
                    ? 'bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-white'
                    : 'text-ink-soft',
                )}
              >
                {n}
              </span>
            ))}
          </div>

          <p className="mb-1.5 mt-4 text-[12px] font-medium text-ink-muted">Kesehatan</p>
          <div className="flex gap-2 text-[13px] font-medium">
            <span className="rounded-full bg-success-soft px-3 py-1.5 text-success">Sehat</span>
            <span className="glass rounded-full px-3 py-1.5 text-ink-soft">Sakit</span>
            <span className="glass rounded-full px-3 py-1.5 text-ink-soft">Obat</span>
          </div>

          <div className="mt-5 flex h-12 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-base font-semibold text-white shadow-[var(--shadow-accent)]">
            Simpan
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip">
      {/* Bilah atas */}
      <header className="sticky top-0 z-30 glass-bar-top border-t-0 border-b border-b-white/70 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 md:px-8 lg:h-[4.5rem] lg:px-12">
          <Brand />
          <nav aria-label="Bagian halaman" className="hidden items-center gap-8 text-[15px] font-medium text-ink-soft lg:flex">
            <a href="#fitur" className="hover:text-primary">Fitur</a>
            <a href="#cara-kerja" className="hover:text-primary">Cara kerja</a>
            <a href="#sebaran" className="hover:text-primary">Sebaran</a>
            <a href="#pasang" className="hover:text-primary">Pasang</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login" className={buttonClassName({ variant: 'outline' })}>
              Masuk
            </Link>
            <Link href="/register-farmer" className={buttonClassName({ className: 'max-sm:hidden' })}>
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 lg:px-12">
        {/* Hero */}
        <section className="grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:py-24">
          <div>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium text-primary-strong">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              Rekording domba untuk peternak dan petugas
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl xl:text-7xl">
              Catat ternak di kandang, <span className="text-primary">cukup satu layar.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted lg:text-xl lg:leading-9">
              Bobot, kondisi tubuh, kesehatan, dan foto tiap domba tersimpan rapi. Buka dari HP, catat
              dalam hitungan detik, lalu lanjut ke ternak berikutnya.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonClassName({ size: 'lg' })}>
                Masuk ke Sheep-In <ArrowRight size={20} aria-hidden="true" className="ml-2" />
              </Link>
              <Link href="/register-farmer" className={buttonClassName({ variant: 'outline', size: 'lg' })}>
                Daftar sebagai peternak
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink-soft">
              <li className="flex items-center gap-2"><Smartphone size={18} className="text-primary" aria-hidden="true" /> Ramah HP</li>
              <li className="flex items-center gap-2"><Camera size={18} className="text-primary" aria-hidden="true" /> Foto langsung dari kamera</li>
              <li className="flex items-center gap-2"><UsersRound size={18} className="text-primary" aria-hidden="true" /> Peternak, petugas, admin</li>
            </ul>
          </div>

          <PhoneMock />
        </section>

        {/* Fitur */}
        <section id="fitur" className="scroll-mt-24 py-10 md:py-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Fitur</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl lg:text-5xl">
              Dibuat untuk pekerjaan harian di kandang
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
            {fitur.map(({ icon: Icon, judul, isi }) => (
              <div key={judul} className="glass rounded-[var(--radius-card)] p-5 lg:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft text-primary-strong">
                  <Icon size={26} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink lg:text-xl">{judul}</h3>
                <p className="mt-2 text-[15px] leading-7 text-ink-muted lg:text-base">{isi}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-24 py-10 md:py-14 lg:py-20">
          <div className="glass-strong rounded-[var(--radius-sheet)] p-6 md:p-10 lg:p-14">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Cara kerja</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink md:text-4xl lg:text-5xl">
              Empat langkah, tanpa alur yang rumit
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-8">
              {langkah.map((item, i) => (
                <li key={item.judul} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-lg font-semibold text-white shadow-[var(--shadow-accent)]">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{item.judul}</h3>
                    <p className="mt-1 text-[15px] leading-7 text-ink-muted">{item.isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Sebaran */}
        <div id="sebaran" className="scroll-mt-24">
          <LandingDistributionSection />
        </div>

        {/* Pasang */}
        <section id="pasang" className="scroll-mt-24 py-10 md:py-14 lg:py-20">
          <div className="glass flex flex-col gap-6 rounded-[var(--radius-sheet)] p-6 md:flex-row md:items-center md:justify-between md:p-10 lg:p-14">
            <div className="flex items-start gap-4 md:gap-6">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-primary-soft text-primary-strong lg:h-16 lg:w-16">
                <Download size={30} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl lg:text-4xl">
                  Pasang di layar utama HP
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted lg:text-lg">
                  Android (Chrome): menu ⋮ lalu Instal aplikasi. iPhone (Safari): ketuk Bagikan lalu Tambah ke Layar
                  Utama. Sheep-In terbuka layar penuh seperti aplikasi biasa.
                </p>
              </div>
            </div>
            <Link href="/login" className={buttonClassName({ size: 'lg', className: 'shrink-0' })}>
              Mulai sekarang
            </Link>
          </div>
        </section>
      </div>

      {/* Kaki */}
      <footer className="glass-bar-top mt-6 border-t">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 py-8 text-[15px] text-ink-muted md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <Brand />
          <p className="max-w-xl">Aplikasi rekording dan evaluasi ternak domba untuk peternak dan tim lapangan.</p>
          <div className="flex gap-5 font-medium text-primary">
            <Link href="/login">Masuk</Link>
            <Link href="/register-farmer">Daftar peternak</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
