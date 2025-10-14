import { FastifyReply } from 'fastify';

// Extend FastifyReply to include cookie methods
interface FastifyReplyWithCookies extends FastifyReply {
  cookie(name: string, value: string, options?: any): this;
}

export interface CookieOptions {
  maxAge: number; // em segundos
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
}

export class CookieHelper {
  /**
   * Configurar cookie seguro para access token
   */
  static setAccessTokenCookie(
    reply: FastifyReply,
    token: string,
    expiresIn: number,
  ): void {
    const options: CookieOptions = {
      maxAge: expiresIn, // 15 minutos por padrão
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };

    (reply as any).cookie('access_token', token, options);
  }

  /**
   * Configurar cookie seguro para refresh token
   */
  static setRefreshTokenCookie(
    reply: FastifyReply,
    token: string,
    expiresIn: number,
    rememberMe: boolean,
  ): void {
    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 // 30 dias se "Remember me"
      : 24 * 60 * 60; // 1 dia se não marcado

    const options: CookieOptions = {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };

    (reply as any).cookie('refresh_token', token, options);
  }

  /**
   * Remover cookies de autenticação
   */
  static clearAuthCookies(reply: FastifyReply): void {
    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0, // Expira imediatamente
    };

    (reply as any).cookie('access_token', '', clearOptions);
    (reply as any).cookie('refresh_token', '', clearOptions);
  }

  /**
   * Extrair token de cookie ou header Authorization
   */
  static extractToken(request: any, cookieName: string): string | null {
    // Primeiro tentar cookie
    if (request.cookies && request.cookies[cookieName]) {
      return request.cookies[cookieName];
    }

    // Depois tentar header Authorization (apenas para access token)
    if (cookieName === 'access_token') {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    return null;
  }

  /**
   * Obter IP do cliente
   */
  static getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }

  /**
   * Obter User-Agent
   */
  static getUserAgent(request: any): string | undefined {
    return request.headers['user-agent'];
  }
}
