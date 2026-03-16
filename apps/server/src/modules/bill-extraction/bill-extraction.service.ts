import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BillExtractionResponse, DEFAULT_CURRENCY, ALLOWED_IMAGE_TYPES } from '@bill/shared';
import { OpenAIExtractionService } from './openai-extraction.service';
import { TablesService } from '../tables/tables.service';

@Injectable()
export class BillExtractionService {
  private readonly logger = new Logger(BillExtractionService.name);

  constructor(
    private readonly openAIExtractionService: OpenAIExtractionService,
    private readonly tablesService: TablesService,
  ) {}

  async extractFromImage(
    tableId: string,
    file: Express.Multer.File,
  ): Promise<BillExtractionResponse> {
    // Validate table exists
    this.tablesService.getTable(tableId);

    // Validate mime type
    const mimeType = file.mimetype as string;
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_TYPE',
        message: `Unsupported image type: ${mimeType}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      });
    }

    this.logger.log(`Processing bill image for table ${tableId}, size: ${file.size} bytes`);

    let extractionResult;
    try {
      extractionResult = await this.openAIExtractionService.extractBillItems(
        file.buffer,
        mimeType,
      );
    } catch (error) {
      this.logger.error(`Extraction failed for table ${tableId}`, error);
      throw new InternalServerErrorException({
        code: 'BILL_EXTRACTION_FAILED',
        message: 'לא הצלחנו לעבד את החשבון. אנא נסה שנית.',
      });
    }

    if (extractionResult.items.length === 0) {
      this.logger.warn(`No items extracted from bill image for table ${tableId}`);
    }

    const items = extractionResult.items.map((item) => ({
      id: uuidv4(),
      name: item.name,
      price: item.price,
      category: item.category,
    }));

    const warnings = extractionResult.warnings ?? [];
    if (items.length === 0) {
      warnings.push('No items could be extracted from the bill image');
    }

    const currency = extractionResult.currency ?? DEFAULT_CURRENCY;

    this.tablesService.saveExtraction(tableId, { items, currency, warnings });

    return {
      tableId,
      items,
      currency,
      warnings,
    };
  }
}
