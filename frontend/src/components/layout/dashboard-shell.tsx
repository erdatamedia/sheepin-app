'use client';
/* eslint-disable @next/next/no-img-element */

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ellipsis,
  History,
  Home,
  LogOut,
  Map,
  MapPin,
  PawPrint,
  ClipboardPlus,
  UserCircle2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';
import { getMe, type MeResponse } from '@/lib/me';
import { labelPeran } from '@/lib/labels';
import { cn } from '@/lib/utils';

type Role = 'ADMIN' | 'OFFICER' | 'FARMER';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

const ALL_ROLES: Role[] = ['ADMIN', 'OFFICER', 'FARMER'];
const STAFF_ROLES: Role[] = ['ADMIN', 'OFFICER'];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Avatar({ me, size }: { me: MeResponse; size: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm';

  return me.photoUrl ? (
    <img
      src={me.photoUrl}
      alt={me.name}
      className={cn('shrink-0 rounded-2xl border border-line object-cover', box)}
    />
  ) : (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl bg-primary font-semibold text-white',
        box,
      )}
    >
      {initials(me.name)}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const isFarmer = me?.role === 'FARMER';
  const visible = (item: NavItem) => !me || item.roles.includes(me.role);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Sidebar desktop: semua menu
  const sidebarItems: NavItem[] = [
    { href: '/dashboard', label: 'Beranda', icon: Home, roles: ALL_ROLES },
    {
      href: '/sheep',
      label: isFarmer ? 'Ternak Saya' : 'Ternak',
      icon: PawPrint,
      roles: ALL_ROLES,
    },
    {
      href: '/recording',
      label: isFarmer ? 'Kerja Hari Ini' : 'Rekording',
      icon: ClipboardPlus,
      roles: ALL_ROLES,
    },
    { href: '/history', label: 'Riwayat', icon: History, roles: ALL_ROLES },
    { href: '/farmers', label: 'Peternak', icon: Users, roles: STAFF_ROLES },
    { href: '/location', label: 'Lokasi', icon: MapPin, roles: ALL_ROLES },
    { href: '/map', label: 'Peta', icon: Map, roles: STAFF_ROLES },
  ];

  // Bottom nav mobile: 4 menu utama + "Lainnya"
  const bottomItems: NavItem[] = [
    { href: '/dashboard', label: 'Beranda', icon: Home, roles: ALL_ROLES },
    { href: '/sheep', label: 'Ternak', icon: PawPrint, roles: ALL_ROLES },
    { href: '/recording', label: 'Rekord', icon: ClipboardPlus, roles: ALL_ROLES },
    isFarmer
      ? { href: '/history', label: 'Riwayat', icon: History, roles: ALL_ROLES }
      : { href: '/map', label: 'Peta', icon: Map, roles: STAFF_ROLES },
  ];

  // Menu tambahan di lembar "Lainnya"
  const moreItems: NavItem[] = [
    ...(isFarmer
      ? []
      : [{ href: '/history', label: 'Riwayat', icon: History, roles: ALL_ROLES }]),
    { href: '/farmers', label: 'Peternak', icon: Users, roles: STAFF_ROLES },
    { href: '/location', label: 'Lokasi', icon: MapPin, roles: ALL_ROLES },
    { href: '/profile', label: 'Profil Saya', icon: UserCircle2, roles: ALL_ROLES },
  ];

  const moreActive = moreItems.some((item) => isActive(item.href));

  return (
    <div className="min-h-screen text-ink">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden w-72 shrink-0 border-r border-line bg-[linear-gradient(180deg,rgba(255,252,245,0.92),rgba(246,240,228,0.88))] p-6 md:block">
          <div className="mb-8">
            <div className="inline-flex rounded-[var(--radius-card)] border border-line bg-white/80 px-4 py-3 shadow-[var(--shadow-soft)]">
              <Image
                src="/sheepin-logo.png"
                alt="Sheep-In"
                width={180}
                height={54}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-ink">Ruang Kerja Ternak</h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Pemantauan ternak, rekording lapangan, dan kontrol data harian.
            </p>
            {me && (
              <Link
                href="/profile"
                className="mt-5 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white/70 px-4 py-4 text-xs text-ink-muted shadow-[var(--shadow-soft)] transition hover:bg-white"
              >
                <Avatar me={me} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{me.name}</p>
                  <p className="mt-1 uppercase tracking-[0.12em]">{labelPeran(me.role)}</p>
                </div>
              </Link>
            )}
          </div>

          <nav aria-label="Menu utama" className="space-y-2">
            {sidebarItems.filter(visible).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active
                      ? 'bg-primary text-white shadow-[var(--shadow-accent)]'
                      : 'text-ink/80 hover:bg-white/70',
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft"
            >
              <LogOut size={18} aria-hidden="true" />
              Keluar
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-3 md:p-8">
          {/* Header ringkas mobile */}
          <header className="mb-4 flex items-center justify-between md:hidden">
            <Image
              src="/sheepin-logo.png"
              alt="Sheep-In"
              width={120}
              height={36}
              priority
              className="h-8 w-auto object-contain"
            />
            {me && (
              <Link href="/profile" aria-label="Buka profil saya" className="rounded-2xl">
                <Avatar me={me} size="sm" />
              </Link>
            )}
          </header>

          <div className="mx-auto max-w-7xl">
            {me && (
              <div className="mb-5 hidden justify-end md:flex">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white/80 px-3 py-2 text-left shadow-[var(--shadow-soft)] transition hover:bg-white"
                >
                  <Avatar me={me} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{me.name}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                      {labelPeran(me.role)}
                    </p>
                  </div>
                  <UserCircle2 size={18} className="text-primary" aria-hidden="true" />
                </Link>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        aria-label="Menu utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgba(255,252,245,0.97)] pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {bottomItems.filter(visible).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[13px] font-medium transition',
                  active ? 'text-primary' : 'text-ink-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition',
                    active && 'bg-primary-soft',
                  )}
                >
                  <Icon size={22} aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={cn(
              'flex min-h-16 flex-col items-center justify-center gap-1 text-[13px] font-medium transition',
              moreActive ? 'text-primary' : 'text-ink-muted',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-14 items-center justify-center rounded-full transition',
                moreActive && 'bg-primary-soft',
              )}
            >
              <Ellipsis size={22} aria-hidden="true" />
            </span>
            Lainnya
          </button>
        </div>
      </nav>

      {/* Lembar "Lainnya" mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu lainnya"
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(39,33,21,0.18)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Menu lainnya</h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup menu"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-primary-soft/60"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1">
              {moreItems.filter(visible).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-2xl px-4 text-base font-medium',
                      active ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-primary-soft/50',
                    )}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-base font-medium text-danger hover:bg-danger-soft"
              >
                <LogOut size={20} aria-hidden="true" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
