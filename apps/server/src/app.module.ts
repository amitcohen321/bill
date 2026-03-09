import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './common/config/configuration';
import { TablesModule } from './modules/tables/tables.module';
import { BillExtractionModule } from './modules/bill-extraction/bill-extraction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    TablesModule,
    BillExtractionModule,
  ],
})
export class AppModule {}
