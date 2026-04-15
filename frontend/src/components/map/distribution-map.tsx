'use client';

import Link from 'next/link';
import type { CSSProperties, ComponentType, ReactNode } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import type { MapDistributionResponse } from '@/lib/location';

type Props = {
  items: MapDistributionResponse['data'];
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
  children: ReactNode;
  position: [number, number];
  icon: unknown;
}>;

const LeafletPopup = Popup as ComponentType<{
  children: ReactNode;
}>;

const LeafletTileLayer = TileLayer as ComponentType<{
  attribution: string;
  url: string;
}>;

export default function DistributionMap({ items }: Props) {
  const center: [number, number] =
    items.length > 0
      ? [items[0].latitude, items[0].longitude]
      : [-8.2143, 114.3012];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <LeafletMapContainer
        center={center}
        zoom={10}
        style={{ height: '420px', width: '100%' }}
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
          >
            <LeafletPopup>
              <div className="min-w-[250px] space-y-2 text-sm">
                <p className="font-semibold">{item.name}</p>
                <p>{item.loginCode || '-'}</p>
                <p>{item.groupName || '-'}</p>
                <p>
                  {[item.village, item.district, item.regency]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
                <hr />
                <p>Total ternak: {item.totalSheep}</p>
                <p>Ternak aktif: {item.activeSheep}</p>
                <p>Layak bibit: {item.eligibleBreeding}</p>
                <p>Perlu pemantauan: {item.monitoring}</p>
                <p>Belum direkomendasikan: {item.notRecommended}</p>

                <div className="grid gap-2 pt-2">
                  <Link
                    href={`/farmers/${item.userId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Lihat Detail Peternak
                  </Link>

                  <Link
                    href="/sheep"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Lihat Data Ternak
                  </Link>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Buka Rute di Google Maps
                  </a>
                </div>
              </div>
            </LeafletPopup>
          </LeafletMarker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}
