import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { addDays } from 'date-fns';

export interface RefreshTokenPayload {
  userId: number;
  rememberMe: boolean;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
}

export interface RefreshTokenInfo {
  tokenId: string;
  token: string;
  expiresAt: Date;
  rememberMe: boolean;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Cria um novo refresh token
   */
  async createRefreshToken(
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenInfo> {
    const token = randomUUID();
    const tokenHash = await bcrypt.hash(token, 10);

    // Determinar tempo de expiração baseado no "Remember me"
    const expiresAt = payload.rememberMe
      ? addDays(new Date(), 30) // 30 dias se "Remember me"
      : addDays(new Date(), 1); // 1 dia se não marcado

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        tokenHash,
        sessionId: payload.sessionId,
        expiresAt,
        rememberMe: payload.rememberMe,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      },
    });

    this.logger.log(
      `Refresh token criado para user ${payload.userId}, expires at ${expiresAt.toISOString()}, rememberMe: ${payload.rememberMe}`,
    );

    return {
      tokenId: refreshToken.tokenId,
      token,
      expiresAt,
      rememberMe: payload.rememberMe,
    };
  }

  /**
   * Valida um refresh token
   */
  async validateRefreshToken(
    token: string,
  ): Promise<{ userId: number; tokenId: string; rememberMe: boolean } | null> {
    try {
      // Buscar todos os refresh tokens não revogados e não expirados
      const refreshTokens = await this.prisma.refreshToken.findMany({
        where: {
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              userId: true,
              userIsLocked: true,
              deletedAt: true,
            },
          },
        },
      });

      // Verificar qual token corresponde ao hash
      for (const refreshToken of refreshTokens) {
        const isValid = await bcrypt.compare(token, refreshToken.tokenHash);

        if (isValid) {
          // Verificar se o utilizador ainda está ativo
          if (refreshToken.user.userIsLocked || refreshToken.user.deletedAt) {
            this.logger.warn(
              `Tentativa de uso de refresh token por utilizador inativo/bloqueado: ${refreshToken.userId}`,
            );
            return null;
          }

          this.logger.log(
            `Refresh token válido para user ${refreshToken.userId}`,
          );

          return {
            userId: refreshToken.userId,
            tokenId: refreshToken.tokenId,
            rememberMe: refreshToken.rememberMe,
          };
        }
      }

      this.logger.warn('Refresh token inválido ou não encontrado');
      return null;
    } catch (error) {
      this.logger.error('Erro ao validar refresh token:', error);
      return null;
    }
  }

  /**
   * Revoga um refresh token específico
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.update({
        where: { tokenId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      this.logger.log(`Refresh token ${tokenId} revogado`);
    } catch (error) {
      this.logger.error(`Erro ao revogar refresh token ${tokenId}:`, error);
      throw new UnauthorizedException('Erro ao revogar token');
    }
  }

  /**
   * Revoga todos os refresh tokens de um utilizador
   */
  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    try {
      const { count } = await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      this.logger.log(`${count} refresh tokens revogados para user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao revogar refresh tokens do user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Rotaciona um refresh token (cria novo e revoga o antigo)
   */
  async rotateRefreshToken(
    oldTokenId: string,
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenInfo> {
    try {
      // Revogar o token antigo
      await this.revokeRefreshToken(oldTokenId);

      // Criar novo token
      const newToken = await this.createRefreshToken(payload);

      this.logger.log(
        `Refresh token rotacionado: ${oldTokenId} -> ${newToken.tokenId}`,
      );

      return newToken;
    } catch (error) {
      this.logger.error('Erro ao rotacionar refresh token:', error);
      throw new UnauthorizedException('Erro ao rotacionar token');
    }
  }

  /**
   * Limpa refresh tokens expirados (task de limpeza)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const { count } = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true, revokedAt: { lt: addDays(new Date(), -7) } }, // Remove revogados há mais de 7 dias
          ],
        },
      });

      if (count > 0) {
        this.logger.log(`${count} refresh tokens expirados removidos`);
      }

      return count;
    } catch (error) {
      this.logger.error('Erro ao limpar refresh tokens expirados:', error);
      return 0;
    }
  }

  /**
   * Obtém estatísticas dos refresh tokens
   */
  async getTokenStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    rememberMeActive: number;
  }> {
    const now = new Date();

    const [total, active, expired, revoked, rememberMeActive] =
      await Promise.all([
        this.prisma.refreshToken.count(),
        this.prisma.refreshToken.count({
          where: {
            isRevoked: false,
            expiresAt: { gt: now },
          },
        }),
        this.prisma.refreshToken.count({
          where: {
            expiresAt: { lte: now },
          },
        }),
        this.prisma.refreshToken.count({
          where: {
            isRevoked: true,
          },
        }),
        this.prisma.refreshToken.count({
          where: {
            isRevoked: false,
            expiresAt: { gt: now },
            rememberMe: true,
          },
        }),
      ]);

    return {
      total,
      active,
      expired,
      revoked,
      rememberMeActive,
    };
  }

  /**
   * Calcula tempo de expiração em segundos para resposta
   */
  getExpirationTime(rememberMe: boolean): number {
    return rememberMe
      ? 30 * 24 * 60 * 60 // 30 dias em segundos
      : 24 * 60 * 60; // 1 dia em segundos
  }
}
