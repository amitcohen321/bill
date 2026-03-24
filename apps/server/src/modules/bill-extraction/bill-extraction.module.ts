import { Module } from '@nestjs/common';
import { BillExtractionController } from './bill-extraction.controller';
import { BillExtractionService } from './bill-extraction.service';
import { GeminiExtractionService } from './gemini-extraction.service';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [TablesModule],
  controllers: [BillExtractionController],
  providers: [BillExtractionService, GeminiExtractionService],
})
export class BillExtractionModule {}
