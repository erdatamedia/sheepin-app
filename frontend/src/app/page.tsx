import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { buttonClassName } from '@/components/ui/button';
import { LandingDistributionSection } from '@/components/map/landing-distribution-section';

const nilaiUtama = [
  {
    judul: 'Rekording lapangan lebih cepat',
    isi: 'Pilih ternak, isi bobot, BCS, dan kesehatan tanpa harus membuka banyak modul yang membingungkan.',
  },
  {
    judul: 'Data peternak dan ternak tetap rapi',
    isi: 'Kepemilikan ternak, lokasi peternak, dan riwayat rekording tersimpan dalam satu alur kerja yang mudah diikuti.',
  },
  {
    judul: 'Siap dipakai peternak dan tim lapangan',
    isi: 'Antarmuka dipisah sesuai peran agar peternak fokus pada kerja harian, sementara admin memantau data secara menyeluruh.',
  },
];

const alurKerja = [
  'Pilih ternak yang akan dicatat hari ini',
  'Isi bobot, BCS, kesehatan, atau kejadian penting',
  'Simpan cepat dan lanjut ke ternak berikutnya',
  'Lihat riwayat untuk evaluasi dan tindak lanjut',
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 md:px-8 md:pb-20 md:pt-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="inline-flex rounded-[var(--radius-card)] border border-line bg-white/80 px-3 py-2 shadow-[var(--shadow-soft)] md:px-4 md:py-3">
            <Image
              src="/sheepin-logo.png"
              alt="Sheep-In"
              width={220}
              height={66}
              priority
              className="h-10 w-auto object-contain md:h-11"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login" className={buttonClassName({ variant: 'outline' })}>
              Masuk
            </Link>
            <Link
              href="/register-farmer"
              className={buttonClassName({ className: 'max-md:hidden' })}
            >
              Daftar Peternak
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-[fadeInUp_.45s_ease-out]">
            <div className="inline-flex rounded-full border border-[color:rgba(33,73,61,0.14)] bg-[rgba(33,73,61,0.08)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Rekording domba berbasis alur kerja
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl">
              Sheep-In membantu peternak dan tim lapangan mencatat ternak dengan lebih cepat, rapi, dan mudah dipahami.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted md:text-lg md:leading-8">
              Dibangun untuk pekerjaan nyata di kandang: pilih ternak, catat kondisi, simpan cepat, lalu lanjut ke aktivitas berikutnya tanpa alur yang terlalu teknis.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonClassName({ size: 'lg' })}>
                Masuk ke Sistem
              </Link>
              <Link
                href="/register-farmer"
                className={buttonClassName({ variant: 'outline', size: 'lg' })}
              >
                Buat Akun Peternak
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {nilaiUtama.map((item) => (
                <Card
                  key={item.judul}
                  className="bg-[linear-gradient(180deg,rgba(255,253,250,0.96),rgba(248,243,234,0.92))] p-5"
                >
                  <p className="text-base font-semibold text-ink">{item.judul}</p>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">{item.isi}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="animate-[fadeInUp_.55s_ease-out]">
            <Card className="relative overflow-hidden border-[color:rgba(33,73,61,0.14)] bg-[linear-gradient(180deg,rgba(255,252,245,0.98),rgba(239,246,241,0.96))] p-6 md:p-7">
              <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[rgba(33,73,61,0.10)] blur-2xl" />
              <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[rgba(210,178,120,0.14)] blur-2xl" />

              <div className="relative">
                <div className="hidden rounded-[28px] border border-[color:rgba(33,73,61,0.10)] bg-white/80 p-4 shadow-[0_10px_24px_rgba(53,43,24,0.06)] md:block">
                  <Image
                    src="/sheepin-logo.png"
                    alt="Logo Sheep-In"
                    width={320}
                    height={96}
                    className="h-16 w-auto object-contain"
                  />
                </div>

                <div className="grid gap-4 md:mt-5">
                  <Card className="bg-white/82 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Alur kerja utama
                    </p>
                    <div className="mt-4 space-y-3">
                      {alurKerja.map((item, index) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-7 text-ink/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="bg-white/78 p-5">
                      <p className="text-sm font-semibold text-ink">Untuk Peternak</p>
                      <p className="mt-2 text-sm leading-7 text-ink-muted">
                        Fokus pada ternak saya, kerja hari ini, riwayat, dan lokasi kandang.
                      </p>
                    </Card>
                    <Card className="bg-white/78 p-5">
                      <p className="text-sm font-semibold text-ink">Untuk Admin dan Petugas</p>
                      <p className="mt-2 text-sm leading-7 text-ink-muted">
                        Pantau distribusi, kelola peternak, lihat kepadatan data, dan audit rekording.
                      </p>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-[28px] border border-line bg-white/72 px-5 py-4 text-sm text-ink-muted shadow-[0_10px_24px_rgba(53,43,24,0.04)] md:flex-row md:items-center md:justify-between">
          <p>
            Sheep-In dirancang untuk rekording ternak domba yang lebih dekat dengan kerja lapangan, bukan sekadar struktur tabel data.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
              Masuk
            </Link>
            <Link href="/register-farmer" className="font-semibold text-primary underline underline-offset-4">
              Daftar peternak
            </Link>
          </div>
        </div>

        <LandingDistributionSection />
      </section>
    </main>
  );
}
