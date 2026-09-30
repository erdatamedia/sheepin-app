import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function isLocalDatabase(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@sheepin.local';
  const resetPassword = process.argv.includes('--reset-password');

  // Kata sandi bawaan hanya boleh untuk database lokal; selain itu wajib lewat env.
  const password =
    process.env.ADMIN_PASSWORD ||
    (isLocalDatabase(connectionString as string) ? 'admin123' : undefined);

  if (!password) {
    throw new Error(
      'Set ADMIN_PASSWORD di env (kata sandi bawaan hanya untuk database lokal).',
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (!resetPassword) {
      console.log(`ℹ️ Admin ${email} sudah ada. Kata sandi TIDAK diubah.`);
      console.log('   Pakai --reset-password bila memang ingin menimpanya.');
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        name: 'Administrator',
        password: await hash(password, 10),
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    console.log(`✅ Kata sandi admin ${email} direset.`);
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Administrator',
      email,
      password: await hash(password, 10),
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Admin dibuat: ${email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
