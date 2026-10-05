'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  CirclePlus,
  History,
  FileBarChart,
  House,
  LogOut,
  Map,
  MapPin,
  PawPrint,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';
import { getMe, type MeResponse } from '@/lib/me';
import { labelPeran } from '@/lib/labels';
import { Avatar } from '@/components/ui/avatar';
import { TourRunner } from '@/components/tour/tour-runner';
import { NAV_TOUR_KEY } from '@/lib/tour';
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

  const isFarmer = me?.role === 'FARMER';
  const isStaff = !!me && STAFF_ROLES.includes(me.role);
  const visible = (item: NavItem) => !me || item.roles.includes(me.role);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Sidebar desktop: semua menu
  const sidebarItems: NavItem[] = [
    { href: '/dashboard', label: 'Beranda', icon: House, roles: ALL_ROLES },
    { href: '/sheep', label: isFarmer ? 'Ternak saya' : 'Ternak', icon: PawPrint, roles: ALL_ROLES },
    { href: '/recording', label: 'Catat', icon: CirclePlus, roles: ALL_ROLES },
    { href: '/history', label: 'Riwayat', icon: History, roles: ALL_ROLES },
    { href: '/farmers', label: 'Peternak', icon: Users, roles: STAFF_ROLES },
    { href: '/map', label: 'Peta', icon: Map, roles: STAFF_ROLES },
    { href: '/reports', label: 'Laporan', icon: FileBarChart, roles: STAFF_ROLES },
    { href: '/location', label: 'Lokasi', icon: MapPin, roles: ALL_ROLES },
    { href: '/profile', label: 'Akun', icon: UserRound, roles: ALL_ROLES },
  ];

  // Bilah tab mobile: lima tab tetap. Petugas mendapat Peta; Riwayat dan Peternak ada di Akun.
  const tabs: NavItem[] = [
    { href: '/dashboard', label: 'Beranda', icon: House, roles: ALL_ROLES },
    { href: '/sheep', label: 'Ternak', icon: PawPrint, roles: ALL_ROLES },
    { href: '/recording', label: 'Catat', icon: CirclePlus, roles: ALL_ROLES },
    isStaff
      ? { href: '/map', label: 'Peta', icon: Map, roles: STAFF_ROLES }
      : { href: '/history', label: 'Riwayat', icon: History, roles: ALL_ROLES },
    { href: '/profile', label: 'Akun', icon: UserRound, roles: ALL_ROLES },
  ];

  const accountPaths = ['/profile', '/location', '/change-pin', '/farmers', '/reports', ...(isStaff ? ['/history'] : [])];
  const tabActive = (href: string) =>
    href === '/profile' ? accountPaths.some(isActive) : isActive(href);

  return (
    <div className="min-h-screen text-ink">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="print:hidden hidden w-[17rem] shrink-0 glass-bar-right p-5 xl:w-[19rem] xl:p-6 md:flex md:flex-col">
          <div className="mb-6">
            <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Sheep-In, beranda">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={44}
                height={44}
                unoptimized
                priority
                className="h-11 w-11 rounded-[12px] shadow-[var(--shadow-accent)]"
              />
              <span className="text-2xl font-semibold tracking-tight text-ink">Sheep-In</span>
            </Link>

            {me && (
              <Link
                href="/profile"
                className="mt-4 flex items-center gap-3 glass rounded-[var(--radius-card)] p-3 transition active:brightness-95"
              >
                <Avatar name={me.name} photoUrl={me.photoUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{me.name}</p>
                  <p className="text-[13px] text-ink-muted">{labelPeran(me.role)}</p>
                </div>
              </Link>
            )}
          </div>

          <nav aria-label="Menu utama" className="flex flex-1 flex-col gap-1">
            {sidebarItems.filter(visible).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  data-tour={NAV_TOUR_KEY[item.href]}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] font-medium transition',
                    active
                      ? 'bg-primary-soft text-primary-strong'
                      : 'text-ink-soft hover:bg-tint active:bg-tint',
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
              className="mt-auto flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[15px] font-medium text-danger transition hover:bg-danger-soft"
            >
              <LogOut size={20} aria-hidden="true" />
              Keluar
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] md:p-8 lg:px-12 lg:py-10">
          <div key={pathname} className="page-enter mx-auto max-w-[90rem]">
            {children}
          </div>
        </main>
      </div>

      {isFarmer && <TourRunner />}

      {/* Bilah tab mobile: kapsul kaca mengambang, tombol Catat di tengah lebih besar dan menonjol */}
      <nav
        aria-label="Menu utama"
        className="print:hidden pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden"
      >
        <div className="glass-strong pointer-events-auto mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-[28px] border shadow-[var(--shadow-sheet)]">
          {tabs.filter(visible).map((item) => {
            const Icon = item.icon;
            const active = tabActive(item.href);

            if (item.href === '/recording') {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label="Catat"
                  aria-current={active ? 'page' : undefined}
                  data-tour={NAV_TOUR_KEY[item.href]}
                  className="relative flex h-full flex-col items-center justify-end pb-1.5"
                >
                  <span
                    className={cn(
                      'absolute -top-6 flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-[var(--background)] text-white shadow-[0_8px_18px_rgba(94,70,50,0.35)] transition active:scale-95',
                      'bg-gradient-to-b from-[var(--btn-top)] to-[var(--btn-bottom)]',
                      active && 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]',
                    )}
                  >
                    <Icon size={30} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      active ? 'text-primary' : 'text-ink-muted',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                data-tour={NAV_TOUR_KEY[item.href]}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:opacity-60',
                  active ? 'text-primary' : 'text-ink-muted',
                )}
              >
                <Icon size={24} strokeWidth={active ? 2.3 : 1.7} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
