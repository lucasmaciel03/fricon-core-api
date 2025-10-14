export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType = 'Bearer' as const;
  expiresIn: number; // Tempo de expiração do access token em segundos
  refreshExpiresIn: number; // Tempo de expiração do refresh token em segundos
  rememberMe: boolean; // Indica se foi usado "Remember me"
  user: {
    userId: number;
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
  };
}
