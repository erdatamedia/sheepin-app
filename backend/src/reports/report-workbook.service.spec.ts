import * as ExcelJS from 'exceljs';
import { ReportWorkbookService } from './report-workbook.service';

function build() {
  const prisma = {
    user: {
      findMany: jest.fn(() =>
        Promise.resolve([
          {
            id: 'f1',
            name: 'Budi',
            groupName: 'Makmur',
            regency: 'Banyuwangi',
            district: 'Glagah',
            village: 'Desa A',
            latitude: -8.2,
            longitude: 114.3,
            createdAt: new Date('2026-04-01'),
            // Data kontak tidak boleh ikut ke laporan walau ada di baris:
            phone: '6281234567890',
            addressDetail: 'Jl. Rahasia 1',
          },
        ]),
      ),
    },
    sheep: {
      findMany: jest.fn(() =>
        Promise.resolve([
          {
            id: 's1',
            sheepCode: 'DMB-1',
            name: 'Putih',
            breed: 'Garut',
            gender: 'FEMALE',
            status: 'ACTIVE',
            birthDate: new Date('2026-01-01'),
            verifiedAt: new Date('2026-09-30'),
            createdAt: new Date('2026-04-02'),
            ownerUserId: 'f1',
            weights: [
              { weightKg: 20, recordDate: new Date('2026-08-01') },
              { weightKg: 26, recordDate: new Date('2026-08-31') },
            ],
            bcsRecords: [{ bcsScore: 3, recordDate: new Date('2026-08-31') }],
            healthRecords: [
              {
                healthStatus: 'HEALTHY',
                diseaseName: null,
                treatment: null,
                medicine: null,
                checkDate: new Date('2026-08-31'),
              },
            ],
            reproductions: [{ status: 'OPEN' }],
          },
        ]),
      ),
    },
  };
  const evaluation = {
    evaluateByIds: jest.fn(() =>
      Promise.resolve(
        new Map([
          [
            's1',
            {
              completeness: { status: 'COMPLETE' },
              evaluation: {
                breedingStatus: 'LAYAK_BIBIT',
                breedingScore: 88,
              },
            },
          ],
        ]),
      ),
    ),
  };
  return new ReportWorkbookService(prisma as never, evaluation as never);
}

async function read(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

describe('ReportWorkbookService', () => {
  it('membuat lima lembar dengan ringkasan yang benar', async () => {
    const result = await build().build({ to: '2026-10-01' });
    expect(result.filename).toBe('laporan-sheepin-2026-10-01.xlsx');
    expect(result.summary).toMatchObject({
      farmers: 1,
      sheep: 1,
      activeSheep: 1,
      eligible: 1,
      verified: 1,
      records: 4,
    });

    const wb = await read(result.buffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      'Ringkasan',
      'Peternak',
      'Ternak',
      'Penimbangan',
      'Kesehatan',
    ]);
  });

  it('lembar Ternak memuat PBBH, penilaian, dan status terverifikasi', async () => {
    const wb = await read((await build().build()).buffer);
    const sheet = wb.getWorksheet('Ternak')!;
    const headers = (sheet.getRow(1).values as string[]).slice(1);
    const row = (sheet.getRow(2).values as unknown[]).slice(1);
    const cell = (name: string) => row[headers.indexOf(name)];
    expect(cell('Kode')).toBe('DMB-1');
    expect(cell('Peternak')).toBe('Budi');
    expect(cell('Bobot terakhir (kg)')).toBe(26);
    expect(cell('PBBH (g/hari)')).toBe(200);
    expect(cell('Penilaian sistem')).toBe('Layak bibit');
    expect(cell('Terverifikasi')).toBe('Ya');
    expect(cell('Kelengkapan data')).toBe('Lengkap');
  });

  it('tidak membocorkan nomor HP, alamat rinci, atau koordinat', async () => {
    const wb = await read((await build().build()).buffer);
    let text = '';
    wb.eachSheet((sheet) =>
      sheet.eachRow((r) => {
        text += JSON.stringify(r.values);
      }),
    );
    expect(text).not.toContain('6281234567890');
    expect(text).not.toContain('Rahasia');
    expect(text).not.toContain('114.3');
    expect(text).not.toContain('-8.2');
  });

  it('lembar Penimbangan memuat tiap penimbangan', async () => {
    const wb = await read((await build().build()).buffer);
    expect(wb.getWorksheet('Penimbangan')!.rowCount).toBe(3);
  });
});
