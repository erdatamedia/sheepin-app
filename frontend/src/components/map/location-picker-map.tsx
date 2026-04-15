'use client';

import type { CSSProperties, ComponentType, ReactNode } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

type Props = {
  latitude: number;
  longitude: number;
  onPick: (lat: number, lng: number) => void;
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

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number } }) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onPick,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <LeafletMapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: '320px', width: '100%' }}
      >
        <LeafletTileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LeafletMarker position={[latitude, longitude]} icon={markerIcon}>
          <LeafletPopup>Titik lokasi peternak</LeafletPopup>
        </LeafletMarker>
        <ClickHandler onPick={onPick} />
      </LeafletMapContainer>
    </div>
  );
}
