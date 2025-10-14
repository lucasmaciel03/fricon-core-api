import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username ou email é obrigatório' })
  identifier: string; // Pode ser username ou email

  @IsString()
  @IsNotEmpty({ message: 'Password é obrigatória' })
  password: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean = false; // Campo para "Lembrar-me"
}
