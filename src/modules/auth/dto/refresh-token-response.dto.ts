/**
 * DTO para resposta do refresh token
 */
export class RefreshTokenResponseDto {
  /**
   * Novo access token JWT
   */
  accessToken: string;

  /**
   * Novo refresh token (rotacionado)
   */
  refreshToken: string;

  /**
   * Tipo do token (sempre "Bearer")
   */
  tokenType: string = 'Bearer';

  /**
   * Tempo de expiração do access token em segundos
   */
  expiresIn: number;

  /**
   * Dados básicos do utilizador
   */
  user: {
    userId: number;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    roles: string[];
  };
}
