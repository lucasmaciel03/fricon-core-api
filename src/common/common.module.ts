import { Module } from '@nestjs/common';
import { PasswordPolicyService } from './services/password-policy.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { DatabaseModule } from '../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PasswordPolicyService, RefreshTokenService],
  exports: [PasswordPolicyService, RefreshTokenService],
})
export class CommonModule {}
