'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  getPublicMapDistribution,
  type PublicMapDistributionResponse,
} from '@/lib/location';

const DistributionMap = dynamic(
  () => import('@/components/map/distribution-map'),
  { ssr: false },
);

export function LandingDistributionSection() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PublicMapDistributionResponse['data']>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getPublicMapDistribution();
        setItems(response.data || []);
      } catch (error) {
        console.error('Gagal memuat sebaran publik:', error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const summary = useMemo(() => {
    return {
      farmers: items.length,
      sheep: items.reduce((total, item) => total + item.totalSheep, 0),
      active: items.reduce((total, item) => total + item.activeSheep, 0),
      regencies: new Set(items.map((item) => item.regency).filter(Boolean)).size,
    };
  }, [items]);

  return (
    <section className="mt-12 md:mt-16">
      <div className="mb-6 max-w-3xl">
        <div className="inline-flex rounded-full border border-line bg-primary-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Sebaran peternak terdaftar
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-ink sm:text-3xl md:text-4xl">
          Peta lapangan memperlihatkan titik peternak yang sudah tercatat di Sheep-In.
        </h2>
        <p className="mt-3 text-base leading-7 text-ink-muted">
          Tampilan ini memberi gambaran cepat tentang persebaran peternak aktif dan populasi ternak yang sudah masuk ke sistem.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-ink-muted">Titik peternak</p>
          <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{summary.farmers}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Total ternak</p>
          <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{summary.sheep}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Ternak aktif</p>
          <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{summary.active}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Kabupaten tercakup</p>
          <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{summary.regencies}</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-4 md:p-5">
        {loading ? (
          <div className="flex h-[320px] md:h-[420px] items-center justify-center rounded-2xl glass">
            <p className="text-sm text-ink-muted">Memuat peta sebaran peternak...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-[320px] md:h-[420px] items-center justify-center rounded-2xl glass">
            <p className="max-w-md text-center text-sm leading-7 text-ink-muted">
              Belum ada data lokasi peternak yang bisa ditampilkan di landing page.
            </p>
          </div>
        ) : (
          <DistributionMap items={items} publicView />
        )}
      </Card>
    </section>
  );
}
