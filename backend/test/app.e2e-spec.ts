import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { AuthController } from './../src/auth/auth.controller';
import { MediaService } from './../src/media/media.service';
import { ObservabilityController } from './../src/observability/observability.controller';
import { PrismaService } from './../src/prisma/prisma.service';
import { UsersController } from './../src/users/users.controller';

describe('Smoke Test API Sheep-In', () => {
  let authController: AuthController;
  let usersController: UsersController;
  let observabilityController: ObservabilityController;
  let mediaService: MediaService;

  const farmerUser = {
    id: 'usr-farmer-01',
    name: 'Fajar',
    email: null,
    loginCode: 'FRM002',
    photoUrl: null,
    phone: '08123',
    address: 'Kandang Barat',
    groupName: 'Kelompok A',
    province: null,
    regency: null,
    district: null,
    village: null,
    addressDetail: null,
    latitude: null,
    longitude: null,
    locationSource: null,
    locationUpdatedAt: null,
    role: 'FARMER',
    isActive: true,
    createdAt: new Date('2026-04-15T00:00:00.000Z'),
    updatedAt: new Date('2026-04-15T00:00:00.000Z'),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(({ where }: { where: Record<string, string> }) => {
        if (
          where.id === farmerUser.id ||
          where.loginCode === farmerUser.loginCode
        ) {
          return farmerUser;
        }

        return null;
      }),
      update: jest.fn(
        ({ data }: { data: Record<string, string | undefined> }) => ({
          ...farmerUser,
          ...data,
          updatedAt: new Date('2026-04-15T06:00:00.000Z'),
        }),
      ),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    authController = moduleFixture.get(AuthController);
    usersController = moduleFixture.get(UsersController);
    observabilityController = moduleFixture.get(ObservabilityController);
    mediaService = moduleFixture.get(MediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('memuat endpoint pemantauan', () => {
    const response = observabilityController.getStatus();

    expect(response.data.status).toBe('sehat');
    expect(response.data.uptimeDetik).toBeGreaterThanOrEqual(0);
  });

  it('menjalankan alur login peternak sampai simpan profil', async () => {
    const loginResponse = await authController.loginFarmer({
      loginCode: 'FRM002',
    });

    expect(loginResponse.access_token).toEqual(expect.any(String));
    expect(loginResponse.user.loginCode).toBe('FRM002');

    const meResponse = await authController.me({ id: farmerUser.id });
    expect(meResponse.id).toBe(farmerUser.id);
    expect(meResponse.role).toBe('FARMER');

    const profileResponse = await usersController.updateMyProfile(
      { id: farmerUser.id },
      {
        name: 'Fajar Ariadi',
        phone: '08123456789',
        groupName: 'Kelompok Inti',
        address: 'Kandang Tengah',
        photoUrl: '/uploads/fajar.png',
      },
    );

    expect(profileResponse.data.name).toBe('Fajar Ariadi');
    expect(profileResponse.data.photoUrl).toBe('/uploads/fajar.png');
  });

  it('mengunggah gambar melalui layanan media', () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnRk8QAAAAASUVORK5CYII=',
      'base64',
    );

    const response = mediaService.uploadImage(
      {
        originalname: 'profil.png',
        mimetype: 'image/png',
        size: pngBuffer.byteLength,
        buffer: pngBuffer,
      },
      {
        protocol: 'http',
        host: 'localhost:8000',
      },
    );

    expect(response.data.path).toMatch(/^\/uploads\/.+\.png$/);
    expect(response.data.url).toContain('/uploads/');
  });
});
