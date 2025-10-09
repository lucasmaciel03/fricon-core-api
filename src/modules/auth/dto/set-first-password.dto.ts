import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetFirstPasswordDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'sduarte.consultor',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'myFirstPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password deve ter pelo menos 6 caracteres' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of new password',
    example: 'myFirstPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Confirmação deve ter pelo menos 6 caracteres' })
  confirmPassword: string;
}
