/**
 * Interface para payload do JWT
 */
export interface JwtPayload {
  sub: number; // User ID
  username: string;
  email?: string;
  roles: string[];
  type?: 'access' | 'refresh';
  iat?: number; // Issued at
  exp?: number; // Expires at
  jti?: string; // JWT ID
}

/**
 * Interface para dados do refresh token
 */
export interface RefreshTokenPayload {
  sub: number; // User ID
  type: 'refresh';
  iat: number; // Issued at
  exp: number; // Expires at
  jti?: string; // JWT ID
}
