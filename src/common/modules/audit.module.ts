import { Module } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}