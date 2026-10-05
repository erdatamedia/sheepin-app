import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import * as nodemailer from 'nodemailer';
import { ReportWorkbookService } from './report-workbook.service';

const TIMEZONE = 'Asia/Jakarta';
/** Bawaan: tanggal 1 tiap bulan pukul 07.00 WIB. */
const DEFAULT_CRON = '0 7 1 * *';

type LastRun = { at: string; ok: boolean; message: string } | null;

function recipientsFromEnv(): string[] {
  return (process.env.REPORT_RECIPIENTS ?? '')
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

function smtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

/**
 * Pengiriman laporan Excel berkala ke peneliti dan dinas lewat SMTP.
 * Diatur lewat variabel lingkungan; bila belum diatur, tidak ada yang dikirim dan jadwal tidak dipasang.
 */
@Injectable()
export class ReportMailService {
  private readonly logger = new Logger(ReportMailService.name);
  private lastRun: LastRun = null;
  private job: CronJob | null = null;

  constructor(private readonly workbook: ReportWorkbookService) {}

  onModuleDestroy() {
    void this.job?.stop();
  }

  onModuleInit() {
    if (!smtpConfigured() || recipientsFromEnv().length === 0) {
      this.logger.log(
        'Laporan berkala tidak aktif (atur SMTP_* dan REPORT_RECIPIENTS untuk mengaktifkan)',
      );
      return;
    }

    const expression = process.env.REPORT_CRON || DEFAULT_CRON;
    try {
      this.job = CronJob.from({
        cronTime: expression,
        timeZone: TIMEZONE,
        onTick: () => {
          void this.sendNow('jadwal').catch((error: Error) =>
            this.logger.error(`Laporan berkala gagal: ${error.message}`),
          );
        },
        start: true,
      });
      this.logger.log(
        `Laporan berkala dijadwalkan "${expression}" (${TIMEZONE}) ke ${recipientsFromEnv().length} penerima`,
      );
    } catch (error) {
      this.logger.error(
        `REPORT_CRON "${expression}" tidak valid: ${(error as Error).message}`,
      );
    }
  }

  status() {
    let nextRun: string | null = null;
    try {
      nextRun = this.job?.nextDate().toISO() ?? null;
    } catch {
      nextRun = null;
    }
    return {
      smtpConfigured: smtpConfigured(),
      recipients: recipientsFromEnv(),
      schedule: process.env.REPORT_CRON || DEFAULT_CRON,
      timezone: TIMEZONE,
      active: nextRun !== null,
      nextRun,
      lastRun: this.lastRun,
    };
  }

  async sendNow(trigger: 'jadwal' | 'manual') {
    const recipients = recipientsFromEnv();
    if (!smtpConfigured()) {
      throw new BadRequestException(
        'Pengiriman email belum diatur di server (SMTP_HOST, SMTP_USER, SMTP_PASS).',
      );
    }
    if (recipients.length === 0) {
      throw new BadRequestException(
        'Belum ada penerima. Isi REPORT_RECIPIENTS di server dengan alamat email dipisah koma.',
      );
    }

    try {
      const report = await this.workbook.build();
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      const s = report.summary;

      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipients,
        subject: `Laporan Sheep-In sampai ${s.period.to}`,
        text: [
          'Yth. Peneliti dan Dinas Pertanian dan Pangan,',
          '',
          `Terlampir rekapitulasi data peternak dan ternak pada Sheep-In sampai ${s.period.to}.`,
          '',
          `- Peternak terdaftar: ${s.farmers}`,
          `- Ternak: ${s.sheep} (aktif ${s.activeSheep})`,
          `- Layak bibit menurut sistem: ${s.eligible}, terverifikasi: ${s.verified}`,
          `- Total catatan: ${s.records}`,
          '',
          'Berkas memuat lembar Ringkasan, Peternak, Ternak, Penimbangan, dan Kesehatan. Data kontak peternak tidak disertakan.',
          '',
          'Email ini dikirim otomatis oleh Sheep-In.',
        ].join('\n'),
        attachments: [
          {
            filename: report.filename,
            content: report.buffer,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });

      this.lastRun = {
        at: new Date().toISOString(),
        ok: true,
        message: `Terkirim ke ${recipients.length} penerima (${trigger})`,
      };
      this.logger.log(this.lastRun.message);
      return this.lastRun;
    } catch (error) {
      this.lastRun = {
        at: new Date().toISOString(),
        ok: false,
        message: `Gagal mengirim: ${(error as Error).message}`,
      };
      throw error;
    }
  }
}
