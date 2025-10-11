import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/strong-password.validator';

export class SetFirstPasswordDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'sduarte.consultor',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description:
      'New strong password (8+ chars, uppercase, lowercase, number, symbol)',
    example: 'MyFirstPassword123!',
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
    example: 'MyFirstPassword123!',
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
