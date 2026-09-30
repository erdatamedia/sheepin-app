/**
 * Persiapan data sebelum indeks unik "User.phone":
 *   pnpm phones:normalize            -> dry-run: hanya melaporkan, tidak mengubah apa pun
 *   pnpm phones:normalize --apply    -> menulis nomor yang sudah dinormalisasi
 *
 * Aturan aman:
 * - Nomor tidak valid TIDAK diubah atau dihapus; hanya dilaporkan untuk diperbaiki manual.
 * - --apply menolak berjalan bila ada nomor ganda (setelah normalisasi) atau nomor tidak valid.
 * - Nomor pribadi disamarkan di output.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { maskPhone, normalizePhone } from '../src/common/phone';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const apply = process.argv.includes('--apply');

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, role: true, phone: true },
    orderBy: { createdAt: 'asc' },
  });

  const toChange: Array<{ id: string; from: string; to: string }> = [];
  const invalid: Array<{
    id: string;
    name: string;
    role: string;
    phone: string;
  }> = [];
  const byNormalized = new Map<string, string[]>();

  for (const user of users) {
    const raw = user.phone as string;
    const normalized = normalizePhone(raw);

    if (!normalized) {
      invalid.push({
        id: user.id,
        name: user.name,
        role: user.role,
        phone: raw,
      });
      continue;
    }

    byNormalized.set(normalized, [
      ...(byNormalized.get(normalized) ?? []),
      user.id,
    ]);
    if (normalized !== raw)
      toChange.push({ id: user.id, from: raw, to: normalized });
  }

  const duplicates = [...byNormalized.entries()].filter(
    ([, ids]) => ids.length > 1,
  );

  console.log(`Pengguna dengan nomor HP : ${users.length}`);
  console.log(
    `Sudah berformat benar    : ${users.length - toChange.length - invalid.length}`,
  );
  console.log(`Akan dinormalisasi       : ${toChange.length}`);
  console.log(`Tidak valid              : ${invalid.length}`);
  console.log(`Ganda setelah normalisasi: ${duplicates.length}`);

  for (const item of invalid) {
    console.log(
      `  ! tidak valid: ${item.name} (${item.role}, ${item.id}) -> ${maskPhone(item.phone)}`,
    );
  }
  for (const [normalized, ids] of duplicates) {
    console.log(
      `  ! ganda: ${maskPhone(normalized)} dipakai ${ids.length} akun (${ids.join(', ')})`,
    );
  }
  for (const item of toChange) {
    console.log(
      `  ~ ${item.id}: ${maskPhone(item.from)} -> ${maskPhone(item.to)}`,
    );
  }

  if (!apply) {
    console.log(
      '\nDry-run selesai. Tidak ada data yang diubah. Tambahkan --apply untuk menulis.',
    );
    return;
  }

  if (invalid.length > 0 || duplicates.length > 0) {
    throw new Error(
      'Ada nomor tidak valid atau ganda. Perbaiki manual dulu, lalu jalankan ulang.',
    );
  }

  await prisma.$transaction(
    toChange.map((item) =>
      prisma.user.update({
        where: { id: item.id },
        data: { phone: item.to },
        // Pilih kolom eksplisit: skrip ini berjalan SEBELUM migrasi, saat kolom PIN belum ada.
        select: { id: true },
      }),
    ),
  );

  console.log(`\nSelesai: ${toChange.length} nomor dinormalisasi.`);
}

main()
  .catch((error) => {
    console.error('Gagal:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
