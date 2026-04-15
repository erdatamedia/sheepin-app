'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getFarmers, type FarmerOption } from '@/lib/farmers';

export default function FarmersPage() {
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getFarmers();
        setFarmers(res.data || []);
      } catch (error) {
        console.error('Gagal memuat data peternak:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredFarmers = useMemo(() => {
    return farmers.filter((item) => {
      const keyword = search.toLowerCase();
      return (
        !search ||
        item.name.toLowerCase().includes(keyword) ||
        (item.loginCode || '').toLowerCase().includes(keyword) ||
        (item.groupName || '').toLowerCase().includes(keyword) ||
        (item.village || '').toLowerCase().includes(keyword) ||
        (item.district || '').toLowerCase().includes(keyword) ||
        (item.regency || '').toLowerCase().includes(keyword)
      );
    });
  }, [farmers, search]);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Data Peternak</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar peternak aktif yang terdaftar di sistem
          </p>
        </div>

        <Card className="mb-6">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              className="pl-10"
              placeholder="Cari nama, ID peternak, kelompok, wilayah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat data peternak...</p>
        ) : filteredFarmers.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">Tidak ada data peternak.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFarmers.map((item) => (
              <Link key={item.id} href={`/farmers/${item.id}`}>
                <Card className="cursor-pointer transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {item.loginCode || '-'}
                      </p>
                    </div>
                    <Badge variant="info">Peternak</Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Kelompok:</span>{' '}
                      {item.groupName || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Wilayah:</span>{' '}
                      {[item.village, item.district, item.regency]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
