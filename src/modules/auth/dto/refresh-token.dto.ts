import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para refresh token request
 */
export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  @IsString({ message: 'Refresh token deve ser uma string' })
  refreshToken: string;
}
