import { BadRequestException } from '@nestjs/common';
import { ReportMailService } from './report-mail.service';

describe('ReportMailService', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  const make = () => new ReportMailService({ build: jest.fn() } as never);

  it('tanpa SMTP: tidak aktif dan kirim sekarang ditolak dengan pesan jelas', async () => {
    delete process.env.SMTP_HOST;
    const service = make();
    expect(service.status()).toMatchObject({
      smtpConfigured: false,
      active: false,
    });
    await expect(service.sendNow('manual')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('SMTP ada tetapi penerima kosong: ditolak', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    delete process.env.REPORT_RECIPIENTS;
    await expect(make().sendNow('manual')).rejects.toThrow(/penerima/i);
  });

  it('mengurai penerima dan membuang alamat tidak valid', () => {
    process.env.REPORT_RECIPIENTS =
      'dinas@banyuwangi.go.id, peneliti@kampus.ac.id; salah, x@y';
    expect(make().status().recipients).toEqual([
      'dinas@banyuwangi.go.id',
      'peneliti@kampus.ac.id',
    ]);
  });
});
