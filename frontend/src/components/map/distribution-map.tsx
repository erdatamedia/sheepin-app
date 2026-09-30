'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties, ComponentType, ReactNode } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, X } from 'lucide-react';
import { buttonClassName } from '@/components/ui/button';
import type {
  MapDistributionResponse,
  PublicMapDistributionResponse,
} from '@/lib/location';

type Item =
  | MapDistributionResponse['data'][number]
  | PublicMapDistributionResponse['data'][number];

type Props = {
  items: MapDistributionResponse['data'] | PublicMapDistributionResponse['data'];
  publicView?: boolean;
};

const markerIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LeafletMapContainer = MapContainer as ComponentType<{
  children: ReactNode;
  center: [number, number];
  zoom: number;
  style: CSSProperties;
}>;

const LeafletMarker = Marker as ComponentType<{
  position: [number, number];
  icon: unknown;
  eventHandlers?: { click?: () => void };
}>;

const LeafletTileLayer = TileLayer as ComponentType<{
  attribution: string;
  url: string;
}>;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-primary-soft/50 px-3 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

export default function DistributionMap({ items, publicView = false }: Props) {
  const [selected, setSelected] = useState<Item | null>(null);

  const center: [number, number] =
    items.length > 0
      ? [items[0].latitude, items[0].longitude]
      : [-8.2143, 114.3012];

  const region = selected
    ? [selected.village, selected.district, selected.regency].filter(Boolean).join(', ') || '-'
    : '';

  return (
    <div className="relative h-[60vh] min-h-[320px] overflow-hidden rounded-2xl border border-line md:h-[480px]">
      <LeafletMapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <LeafletTileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {items.map((item) => (
          <LeafletMarker
            key={item.userId}
            position={[item.latitude, item.longitude]}
            icon={markerIcon}
            eventHandlers={{ click: () => setSelected(item) }}
          />
        ))}
      </LeafletMapContainer>

      {selected && (
        <div
          role="dialog"
          aria-label={`Detail ${selected.name}`}
          className="absolute inset-x-0 bottom-0 z-[1000] max-h-[75%] overflow-auto rounded-t-[24px] border-t border-line bg-surface p-4 shadow-[0_-10px_28px_rgba(39,33,21,0.18)] md:inset-x-auto md:bottom-3 md:left-3 md:w-80 md:rounded-[24px] md:border"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{selected.name}</p>
              {!publicView && 'loginCode' in selected && (
                <p className="text-sm text-ink-muted">{selected.loginCode || '-'}</p>
              )}
              <p className="text-sm text-ink-muted">{selected.groupName || '-'}</p>
              <p className="text-sm text-ink-muted">{region}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup detail"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-primary-soft/60"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <Stat label="Total ternak" value={selected.totalSheep} />
            <Stat label="Ternak aktif" value={selected.activeSheep} />
            {!publicView && 'eligibleBreeding' in selected && (
              <Stat label="Layak bibit" value={selected.eligibleBreeding} />
            )}
            {!publicView && 'monitoring' in selected && (
              <Stat label="Perlu dipantau" value={selected.monitoring} />
            )}
            {!publicView && 'notRecommended' in selected && (
              <Stat label="Belum direkomendasikan" value={selected.notRecommended} />
            )}
          </div>

          <div className="grid gap-2">
            {!publicView && (
              <>
                <Link
                  href={`/farmers/${selected.userId}`}
                  className={buttonClassName({ className: 'w-full' })}
                >
                  Lihat Detail Peternak
                </Link>
                <Link
                  href="/sheep"
                  className={buttonClassName({ variant: 'outline', className: 'w-full' })}
                >
                  Lihat Data Ternak
                </Link>
              </>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClassName({ variant: 'outline', className: 'w-full' })}
            >
              <Navigation size={18} aria-hidden="true" />
              {publicView ? 'Buka Titik di Google Maps' : 'Buka Rute di Google Maps'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
