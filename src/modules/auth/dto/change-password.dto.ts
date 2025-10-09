import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description:
      'Current password (required only if user already has a password set)',
    example: 'currentPassword123',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password atual deve ter pelo menos 6 caracteres' })
  currentPassword?: string;

  @ApiProperty({
    description: 'New password',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Nova password deve ter pelo menos 6 caracteres' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of new password',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Confirmação deve ter pelo menos 6 caracteres' })
  confirmPassword: string;
}
