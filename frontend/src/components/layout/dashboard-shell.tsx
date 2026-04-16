'use client';
/* eslint-disable @next/next/no-img-element */

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Sheet,
  Smartphone,
  Home,
  MapPin,
  Map,
  Users,
  ClipboardPlus,
  History,
  UserCircle2,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';
import { getMe, type MeResponse } from '@/lib/me';
import { labelPeran } from '@/lib/labels';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await getMe();
        setMe(data);
      } catch (error) {
        console.error('Gagal memuat profil:', error);
      }
    };

    fetchMe();
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dasbor',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/sheep',
      label: me?.role === 'FARMER' ? 'Ternak Saya' : 'Ternak',
      icon: Sheet,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/recording',
      label: me?.role === 'FARMER' ? 'Kerja Hari Ini' : 'Rekording',
      icon: ClipboardPlus,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/history',
      label: 'Riwayat',
      icon: History,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/farmers',
      label: 'Peternak',
      icon: Users,
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      href: '/location',
      label: 'Lokasi',
      icon: MapPin,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/map',
      label: 'Peta',
      icon: Map,
      roles: ['ADMIN', 'OFFICER'],
    },
  ].filter((item) => !me || item.roles.includes(me.role));

  const mobileNavItems = [
    {
      href: '/dashboard',
      label: 'Beranda',
      icon: Home,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/sheep',
      label: me?.role === 'FARMER' ? 'Ternak' : 'Ternak',
      icon: Sheet,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/recording',
      label: me?.role === 'FARMER' ? 'Kerja' : 'Rekord',
      icon: ClipboardPlus,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: '/history',
      label: 'Riwayat',
      icon: History,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
    {
      href: me?.role === 'FARMER' ? '/location' : '/farmers',
      label: me?.role === 'FARMER' ? 'Lokasi' : 'Peternak',
      icon: me?.role === 'FARMER' ? MapPin : Users,
      roles: ['ADMIN', 'OFFICER', 'FARMER'],
    },
  ].filter((item) => !me || item.roles.includes(me.role));

  return (
    <div className="min-h-screen text-[color:var(--foreground)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-[color:rgba(86,74,50,0.12)] bg-[linear-gradient(180deg,rgba(255,252,245,0.92),rgba(246,240,228,0.88))] p-6 md:block">
          <div className="mb-8">
            <div className="inline-flex rounded-[24px] border border-[color:rgba(33,73,61,0.12)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(53,43,24,0.05)]">
              <Image
                src="/sheepin-logo.png"
                alt="Sheep-In"
                width={180}
                height={54}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">
              Ruang Kerja Ternak
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
              Pemantauan ternak, rekording lapangan, dan kontrol data harian.
            </p>
            {me && (
              <div className="mt-5 rounded-[24px] border border-[color:rgba(86,74,50,0.12)] bg-white/70 px-4 py-4 text-xs text-[color:var(--ink-muted)] shadow-[0_10px_30px_rgba(53,43,24,0.06)]">
                <div className="flex items-center gap-3">
                  {me.photoUrl ? (
                    <img
                      src={me.photoUrl}
                      alt={me.name}
                      className="h-14 w-14 rounded-2xl border border-[color:rgba(86,74,50,0.12)] object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-lg font-semibold text-white">
                      {me.name
                        .split(' ')
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{me.name}</p>
                    <p className="mt-1 uppercase tracking-[0.12em]">{labelPeran(me.role)}</p>
                    {me.loginCode && <p>ID: {me.loginCode}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition ${
                    active
                      ? 'bg-[color:var(--accent)] text-white shadow-[0_14px_28px_rgba(33,73,61,0.18)]'
                      : 'text-gray-700 hover:bg-white/70'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50/80"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {me && (
              <div className="mb-5 flex justify-end">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-3 rounded-[22px] border border-[color:rgba(86,74,50,0.12)] bg-white/82 px-3 py-2 text-left shadow-[0_10px_24px_rgba(53,43,24,0.05)] transition hover:bg-white"
                >
                  {me.photoUrl ? (
                    <img
                      src={me.photoUrl}
                      alt={me.name}
                      className="h-10 w-10 rounded-2xl border border-[color:rgba(86,74,50,0.12)] object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-sm font-semibold text-white">
                      {me.name
                        .split(' ')
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{me.name}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
                      {labelPeran(me.role)}
                    </p>
                  </div>
                  <UserCircle2 size={18} className="text-[color:var(--accent)]" />
                </Link>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:rgba(86,74,50,0.12)] bg-[rgba(255,252,245,0.96)] backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition ${
                  active ? 'text-[color:var(--accent)]' : 'text-gray-500'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-red-600 transition"
          >
            <Smartphone size={18} />
            Keluar
          </button>
        </div>
      </nav>
    </div>
  );
}
