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

        if (!allowedRoles.includes(me.role)) {
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
  }, [allowedRoles, fallbackPath, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">Memeriksa akses...</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
