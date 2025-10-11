import { Module } from '@nestjs/common';
import { PasswordPolicyService } from './services/password-policy.service';
import { DatabaseModule } from '../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PasswordPolicyService],
  exports: [PasswordPolicyService],
})
export class CommonModule {}