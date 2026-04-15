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

async function main() {
  const email = 'admin@sheepin.local';
  const password = 'admin123';

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  const hashedPassword = await hash(password, 10);

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        name: 'Administrator',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    console.log('✅ Admin updated');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Administrator',
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Admin created');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
