import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonClassName } from '@/components/ui/button';
import { LandingDistributionSection } from '@/components/map/landing-distribution-section';
import { CursorField } from '@/components/landing/cursor-field';
import { LineSheep, WoolSheep } from '@/components/landing/decor';
import { Magnetic } from '@/components/landing/magnetic';
import { LoginQr } from '@/components/landing/login-qr';
import { TabCarousel, type CarouselTab } from '@/components/landing/tab-carousel';
import { LOGIN_URL } from '@/lib/site';
import { SpotlightCard } from '@/components/landing/spotlight-card';
import { cn } from '@/lib/utils';

const situasi = [
  {
    tanya: 'Dombanya putih semua. Yang tadi ditimbang yang mana?',
    jawab:
      'Tiap domba punya foto wajah, samping, dan belakang, ditambah ciri khusus seperti bentuk telinga atau tanda di ekor. Cari lewat foto, tidak perlu hafalan.',
  },
  {
    tanya: 'Bobotnya naik atau malah turun?',
    jawab:
      'Setiap timbangan tersimpan bersama tanggalnya. Pertambahan bobot per hari dihitung sendiri, jadi kelihatan domba mana yang tumbuh dan mana yang tertinggal.',
  },
  {
    tanya: 'Siapa yang sakit minggu ini?',
    jawab:
      'Catat gejala dan obatnya sekali, lalu domba yang pemeriksaan terakhirnya sakit muncul di daftar tersendiri sampai dinyatakan pulih.',
  },
  {
    tanya: 'Petugas ingin tahu kondisi satu kelompok.',
    jawab:
      'Laporan per peternak dan peta sebaran sudah tersedia, dan bisa diunduh ke Excel untuk dilampirkan.',
  },
];

const tabs: CarouselTab[] = [
  {
    id: 'masalah',
    label: 'Kenapa dicatat',
    content: (
      <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl lg:text-5xl">
            Pertanyaan yang sering muncul di kandang
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-ink-muted lg:text-lg">
            Sheep-In dibuat untuk menjawabnya tanpa membuka buku tulis.
          </p>
          <LineSheep className="mt-8 hidden w-56 opacity-[0.16] lg:block" />
        </div>
        <ul>
          {situasi.map((s) => (
            <li key={s.tanya} className="border-t border-line py-6 first:border-t-0 first:pt-0 lg:py-8">
              <h3 className="text-xl font-semibold leading-snug text-ink lg:text-2xl">{s.tanya}</h3>
              <p className="mt-2.5 max-w-2xl text-base leading-7 text-ink-muted lg:text-lg lg:leading-8">{s.jawab}</p>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'cara-kerja',
    label: 'Cara kerja',
    content: (
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="relative order-2 lg:order-1">
          <WoolSheep className="absolute -bottom-6 -left-4 w-24 text-primary/[0.14] sm:w-32" />
          <PhoneMock />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl lg:text-5xl">
            Satu layar untuk satu domba
          </h2>
          <ol className="mt-8 space-y-6 text-lg leading-8 text-ink-muted">
            <li>
              <span className="font-semibold text-ink">Pilih dombanya</span>, dari daftar atau dengan mengetuk
              fotonya.
            </li>
            <li>
              <span className="font-semibold text-ink">Isi angkanya.</span> Bobot, kondisi tubuh, dan kesehatan
              hari ini ada di layar yang sama, dengan tombol besar yang mudah ditekan sambil memegang domba.
            </li>
            <li>
              <span className="font-semibold text-ink">Simpan</span>, lalu lanjut ke domba berikutnya. Riwayat dan
              grafiknya terbentuk sendiri.
            </li>
          </ol>
          <Magnetic className="mt-9">
            <Link href="/register-farmer" className={buttonClassName({ variant: 'outline', size: 'lg' })}>
              Coba sebagai peternak
            </Link>
          </Magnetic>
        </div>
      </div>
    ),
  },
  {
    id: 'sebaran',
    label: 'Sebaran peternak',
    content: <LandingDistributionSection />,
  },
  {
    id: 'pasang',
    label: 'Pasang & masuk',
    content: (
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SpotlightCard className="flex flex-col items-center p-6 text-center lg:p-8">
          <LoginQr url={LOGIN_URL} className="w-48 lg:w-60" />
          <p className="mt-5 text-xl font-semibold text-ink">Pindai untuk masuk</p>
          <p className="mt-1 text-[15px] text-ink-muted">{LOGIN_URL.replace(/^https?:\/\//, '')}</p>
          <Link href="/qr" className="mt-4 text-[15px] font-medium text-primary-strong underline underline-offset-4">
            Tampilkan layar penuh
          </Link>
        </SpotlightCard>
        <div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl lg:text-5xl">
            Tidak perlu unduh dari toko aplikasi
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted lg:text-lg">
            Pasang langsung dari browser. Ikon domba muncul di layar utama dan Sheep-In terbuka layar penuh.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <SpotlightCard className="p-6">
              <h3 className="text-xl font-semibold text-ink">Android (Chrome)</h3>
              <p className="mt-3 text-base leading-7 text-ink-muted">
                Buka sheep-in.com, ketuk tombol menu ⋮ di pojok kanan atas, lalu pilih{' '}
                <b className="text-ink">Instal aplikasi</b>.
              </p>
            </SpotlightCard>
            <SpotlightCard className="p-6">
              <h3 className="text-xl font-semibold text-ink">iPhone (Safari)</h3>
              <p className="mt-3 text-base leading-7 text-ink-muted">
                Buka sheep-in.com di Safari, ketuk <b className="text-ink">Bagikan</b>, lalu pilih{' '}
                <b className="text-ink">Tambah ke Layar Utama</b>.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>
    ),
  },
];

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)} aria-label="Sheep-In, beranda">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={44}
        height={44}
        unoptimized
        priority
        className="h-10 w-10 rounded-[12px] shadow-[var(--shadow-accent)] lg:h-11 lg:w-11"
      />
      <span className="text-xl font-semibold tracking-tight text-ink lg:text-2xl">Sheep-In</span>
    </Link>
  );
}

/** Contoh catatan untuk hero; hanya hiasan. */
function NoteCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden="true" className={cn('glass-strong w-52 rounded-[var(--radius-card)] p-4', className)} style={style}>
      <p className="text-[12px] text-ink-muted">Domba 014 · hari ini</p>
      <p className="mt-0.5 text-3xl font-semibold tabular-nums text-ink">
        32,5<span className="ml-1 text-base font-medium text-ink-muted">kg</span>
      </p>
      <p className="mt-1 text-[13px] text-ink-soft">Naik 0,4 kg dari minggu lalu</p>
    </div>
  );
}

function PhoneMock() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-[19rem] lg:max-w-[21rem]">
      <div className="glass-strong rounded-[2.5rem] p-3 shadow-[0_30px_60px_rgba(94,70,50,0.25)]">
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
                  n === '3' ? 'bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-white' : 'text-ink-soft',
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
    <CursorField className="page-enter overflow-x-clip">
      {/* Bilah atas */}
      <header className="sticky top-0 z-30 glass-bar-top border-b border-b-white/70 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 md:px-8 lg:h-[4.5rem] lg:px-12">
          <Brand />
          <nav aria-label="Bagian halaman" className="hidden items-center gap-8 text-[15px] font-medium text-ink-soft lg:flex">
            <a href="#masalah" className="hover:text-primary">Kenapa dicatat</a>
            <a href="#cara-kerja" className="hover:text-primary">Cara kerja</a>
            <a href="#sebaran" className="hover:text-primary">Sebaran</a>
            <a href="#pasang" className="hover:text-primary">Pasang &amp; masuk</a>
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

      <main className="relative z-10 mx-auto w-full max-w-[90rem] px-4 md:px-8 lg:px-12">
        {/* Hero */}
        <section className="relative grid items-center gap-8 pb-16 pt-10 md:pt-14 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24">
          <div className="relative z-10">
            <p className="rise text-[15px] font-medium text-primary-strong" style={{ '--delay': '0ms' } as React.CSSProperties}>
              Sheep-In · pencatatan domba
            </p>
            <h1
              className="rise mt-4 text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
              style={{ '--delay': '90ms' } as React.CSSProperties}
            >
              Buku catatan kandang, di saku Anda.
            </h1>
            <p
              className="rise mt-6 max-w-xl text-lg leading-8 text-ink-muted lg:text-xl lg:leading-9"
              style={{ '--delay': '200ms' } as React.CSSProperties}
            >
              Timbang, foto, catat kesehatannya. Semua tersimpan per domba, jadi bulan depan Anda tidak
              perlu mengingat-ingat lagi.
            </p>
            <div className="rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ '--delay': '320ms' } as React.CSSProperties}>
              <Magnetic>
                <Link href="/login" className={buttonClassName({ size: 'lg' })}>
                  Masuk <ArrowRight size={20} aria-hidden="true" className="ml-2" />
                </Link>
              </Magnetic>
              <Link
                href="/register-farmer"
                className="text-[17px] font-medium text-ink underline decoration-primary/40 underline-offset-[6px] transition hover:decoration-primary"
              >
                Belum punya akun? Daftar peternak
              </Link>
              <Link
                href="/qr"
                className="text-[15px] font-medium text-ink-muted underline decoration-primary/30 underline-offset-[6px] transition hover:text-ink hover:decoration-primary"
              >
                Tampilkan QR masuk
              </Link>
            </div>
          </div>

          {/* Komposisi domba */}
          <div aria-hidden="true" className="relative mx-auto h-[19rem] w-full max-w-xl sm:h-[26rem] lg:h-[34rem] lg:max-w-none">
            <LineSheep className="parallax absolute right-0 top-[8%] w-[92%] opacity-[0.42]" style={{ '--d': 26, '--r': '-3deg' } as React.CSSProperties} />
            <NoteCard
              className="parallax absolute bottom-[6%] left-0 sm:left-[4%]"
              style={{ '--d': 46, '--r': '-2deg' } as React.CSSProperties}
            />
            <WoolSheep
              className="parallax absolute -top-2 left-[6%] w-20 text-primary/20 sm:w-28"
              style={{ '--d': 38, '--r': '4deg' } as React.CSSProperties}
            />
          </div>

          {/* Kawanan di dasar hero */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 overflow-hidden">
            <WoolSheep className="absolute bottom-0 w-20 text-primary/[0.12] [animation:wander_90s_linear_infinite]" />
            <WoolSheep className="absolute bottom-0 w-14 text-primary/[0.09] [animation:wander_120s_linear_infinite_-40s]" />
            <WoolSheep className="absolute bottom-0 w-24 text-primary/[0.10] [animation:wander_105s_linear_infinite_-75s]" />
          </div>
        </section>

        {/* Isi bergantian: tab dengan panel carousel */}
        <section className="py-14 lg:py-24">
          <TabCarousel tabs={tabs} />
        </section>
      </main>

      {/* Kaki */}
      <footer className="relative z-10 border-t border-line">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-10 h-10 overflow-hidden">
          <WoolSheep className="absolute bottom-0 w-14 text-primary/[0.16] [animation:wander_70s_linear_infinite_-20s]" />
        </div>
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 py-8 text-[15px] text-ink-muted md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <Brand />
          <p>Aplikasi pencatatan dan evaluasi ternak domba.</p>
          <div className="flex gap-5 font-medium text-primary-strong">
            <Link href="/login">Masuk</Link>
            <Link href="/register-farmer">Daftar peternak</Link>
          </div>
        </div>
      </footer>
    </CursorField>
  );
}
