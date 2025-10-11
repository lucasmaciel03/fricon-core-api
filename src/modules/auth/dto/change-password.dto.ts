import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/strong-password.validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description:
      'Current password (required only if user already has a password set)',
    example: 'MyCurrentPass123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    description:
      'New strong password (8+ chars, uppercase, lowercase, number, symbol)',
    example: 'MyNewPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'Password deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo especial',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of new password',
    example: 'MyNewPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'Confirmação deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo especial',
  })
  confirmPassword: string;
}
