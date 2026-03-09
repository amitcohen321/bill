import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BillExtractionService } from './bill-extraction.service';
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@bill/shared';

@Controller('tables/:tableId')
export class BillExtractionController {
  constructor(private readonly billExtractionService: BillExtractionService) {}

  @Post('bill-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException({
              code: 'INVALID_IMAGE_TYPE',
              message: `Unsupported image type: ${file.mimetype}`,
            }),
            false,
          );
        }
      },
    }),
  )
  async uploadBillImage(
    @Param('tableId') tableId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: 'NO_IMAGE',
        message: 'No image file provided. Use field name "image".',
      });
    }
    return this.billExtractionService.extractFromImage(tableId, file);
  }
}
