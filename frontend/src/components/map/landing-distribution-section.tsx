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

  const stats = [
    { label: 'Titik peternak', value: summary.farmers },
    { label: 'Total ternak', value: summary.sheep },
    { label: 'Ternak aktif', value: summary.active },
    { label: 'Kabupaten tercakup', value: summary.regencies },
  ];

  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl lg:text-5xl">
          Peternak yang sudah tercatat
        </h2>
        <p className="mt-3 text-base leading-7 text-ink-muted lg:text-lg">
          Titik di peta adalah peternak yang sudah memasukkan lokasinya.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="lg:p-7">
            <p className="text-sm text-ink-muted lg:text-base">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-ink lg:text-5xl">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden p-3 md:mt-6 md:p-5">
        {loading ? (
          <div className="flex h-[320px] items-center justify-center rounded-2xl bg-tint md:h-[440px] lg:h-[560px]">
            <p className="text-sm text-ink-muted">Memuat peta sebaran peternak...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-2xl bg-tint md:h-[440px] lg:h-[560px]">
            <p className="max-w-md text-center text-sm leading-7 text-ink-muted">
              Belum ada data lokasi peternak yang bisa ditampilkan.
            </p>
          </div>
        ) : (
          <DistributionMap items={items} publicView />
        )}
      </Card>
    </section>
  );
}
