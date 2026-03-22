import { Module } from '@nestjs/common';
import { TablesModule } from '../tables/tables.module';
import { SessionService } from './session.service';
import { SessionGateway } from './session.gateway';

@Module({
  imports: [TablesModule],
  providers: [SessionService, SessionGateway],
})
export class SessionModule {}
