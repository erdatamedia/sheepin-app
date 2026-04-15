import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { MediaService, type UploadedImageFile } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('unggah-gambar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (
        _req: Request,
        file: UploadedImageFile,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('File harus berupa gambar'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('File gambar wajib dipilih');
    }

    return this.mediaService.uploadImage(file, {
      protocol: request.protocol,
      host: request.get('host') || 'localhost',
    });
  }
}
