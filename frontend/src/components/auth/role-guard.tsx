'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/lib/auth';
import { getMe, type MeResponse } from '@/lib/me';

type RoleGuardProps = {
  allowedRoles: Array<'ADMIN' | 'OFFICER' | 'FARMER'>;
  children: React.ReactNode;
  fallbackPath?: string;
};

export function RoleGuard({
  allowedRoles,
  children,
  fallbackPath = '/dashboard',
}: RoleGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  // Halaman mengirim array baru tiap render; kunci berbasis string mencegah efek (dan getMe) berulang.
  const rolesKey = allowedRoles.join(',');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = getToken();

        if (!token) {
          removeToken();
          router.replace('/login');
          return;
        }

        const me: MeResponse = await getMe();

        if (!rolesKey.split(',').includes(me.role)) {
          router.replace(fallbackPath);
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Role guard error:', error);
        removeToken();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [rolesKey, fallbackPath, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p role="status" className="text-sm text-ink-muted">
          Memeriksa akses...
        </p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
