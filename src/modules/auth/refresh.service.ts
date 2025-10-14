import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { RefreshTokenService } from '../../common/services/refresh-token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class RefreshService {
  private readonly logger = new Logger(RefreshService.name);

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Renovar access token usando refresh token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<RefreshTokenResponseDto> {
    // Validar refresh token
    const tokenInfo = await this.refreshTokenService.validateRefreshToken(
      refreshTokenDto.refreshToken,
    );

    if (!tokenInfo) {
      this.logger.warn('Tentativa de refresh com token inválido');
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Buscar dados do utilizador
    const user = await this.usersService.findById(tokenInfo.userId);
    if (!user) {
      this.logger.warn(
        `Utilizador ${tokenInfo.userId} não encontrado durante refresh`,
      );
      throw new UnauthorizedException('Utilizador não encontrado');
    }

    // Gerar novo access token
    const newAccessToken = this.generateAccessToken(user);

    // Rotacionar refresh token
    const newRefreshTokenInfo =
      await this.refreshTokenService.rotateRefreshToken(tokenInfo.tokenId, {
        userId: tokenInfo.userId,
        rememberMe: tokenInfo.rememberMe,
        ipAddress,
        userAgent,
      });

    // Extrair roles
    const roles = user.userRoles.map((ur) => ur.role.roleName);

    // Calcular tempo de expiração
    const accessTokenExpiration = this.getAccessTokenExpiration();

    this.logger.log(`Access token renovado para user ${user.userId}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenInfo.token,
      tokenType: 'Bearer',
      expiresIn: accessTokenExpiration,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email || '',
        firstName: user.firstname,
        lastName: user.lastname,
        roles,
      },
    };
  }

  /**
   * Gerar Access Token JWT
   */
  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.userId,
      username: user.username,
      email: user.email,
      roles: user.userRoles.map((ur: any) => ur.role.roleName),
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION') || '15m',
    });
  }

  /**
   * Obter tempo de expiração do access token em segundos
   */
  private getAccessTokenExpiration(): number {
    const expiration =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '15m';

    // Converter string de tempo para segundos
    if (expiration.endsWith('m')) {
      return parseInt(expiration, 10) * 60;
    } else if (expiration.endsWith('h')) {
      return parseInt(expiration, 10) * 3600;
    } else if (expiration.endsWith('d')) {
      return parseInt(expiration, 10) * 86400;
    } else {
      return parseInt(expiration, 10) || 900; // 15 minutos por padrão
    }
  }
}
