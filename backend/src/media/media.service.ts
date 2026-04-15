import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');

mkdirSync(uploadsDir, { recursive: true });

export type UploadedImageFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

@Injectable()
export class MediaService {
  uploadImage(
    file: UploadedImageFile,
    requestMeta: { protocol: string; host: string },
  ) {
    const extension = extname(file.originalname).toLowerCase();
    const baseName = sanitizeFileName(file.originalname.replace(extension, ''));
    const filename = `${baseName || 'foto'}-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;
    const fullPath = join(uploadsDir, filename);

    writeFileSync(fullPath, file.buffer);

    const relativePath = `/uploads/${filename}`;
    const publicBaseUrl =
      process.env.MEDIA_PUBLIC_BASE_URL?.trim() ||
      `${requestMeta.protocol}://${requestMeta.host}`;

    return {
      message: 'Gambar berhasil diunggah',
      data: {
        driver: process.env.STORAGE_DRIVER?.trim() || 'lokal',
        path: relativePath,
        url: `${publicBaseUrl}${relativePath}`,
        filename,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }
}
