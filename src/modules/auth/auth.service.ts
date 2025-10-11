import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { PasswordPolicyService } from '../../common/services/password-policy.service';
import { PasswordNotSetException, UserLockedException } from './exceptions';
import { LoginDto, LoginResponseDto } from './dto';
import { RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { UserWithRelations } from './types/user.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  /**
   * Validar credenciais do utilizador
   * Retorna o utilizador se válido, null caso contrário
   */
  async validateUser(
    identifier: string,
    password: string,
  ): Promise<UserWithRelations | null> {
    // Buscar utilizador por username ou email
    const user = await this.usersService.findByUsernameOrEmail(identifier);

    if (!user) {
      this.logger.warn(`Login attempt with invalid identifier: ${identifier}`);
      return null;
    }

    // Verificar se utilizador está bloqueado
    if (user.userIsLocked) {
      this.logger.warn(
        `Login attempt for locked user: ${user.username} (ID: ${user.userId})`,
      );
      throw new UserLockedException();
    }

    // Verificar se utilizador tem password definida
    if (!user.passwordHash) {
      this.logger.warn(
        `Login attempt for user without password: ${user.username} (ID: ${user.userId})`,
      );
      throw new PasswordNotSetException();
    }

    // Validar password
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Failed login attempt for user: ${user.username} (ID: ${user.userId})`,
      );

      // Registar tentativa falhada
      await this.recordLoginAttempt(user.userId, false, 'INVALID_PASSWORD');

      // Verificar se deve bloquear utilizador
      await this.checkAndLockUser(user.userId);

      return null;
    }

    // Login bem-sucedido
    this.logger.log(
      `Successful login for user: ${user.username} (ID: ${user.userId})`,
    );

    return user;
  }

  /**
   * Fazer login e retornar tokens
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(
      loginDto.identifier,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Registar login bem-sucedido
    await this.recordLoginAttempt(user.userId, true, 'SUCCESS');

    // Atualizar último login
    await this.usersService.updateLastLogin(user.userId);

    // Gerar tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Criar sessão
    await this.createSession(user.userId, accessToken, refreshToken);

    // Extrair roles
    const roles = user.userRoles.map((ur) => ur.role.roleName);

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  /**
   * Gerar Access Token JWT
   */
  private async generateAccessToken(user: any): Promise<string> {
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
   * Gerar Refresh Token JWT
   */
  private async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      sub: user.userId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION') || '7d',
    });
  }

  /**
   * Renovar tokens usando refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      // 1. Verificar e decodificar refresh token
      const decoded = this.jwtService.verify(
        refreshToken,
      ) as RefreshTokenPayload;

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      // 2. Buscar sessão na base de dados
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: decoded.sub,
          refreshTokenHash: refreshToken,
          isRevoked: false,
        },
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Sessão inválida ou expirada');
      }

      // 3. Verificar se o utilizador ainda está ativo
      if (session.user.userIsLocked) {
        throw new UnauthorizedException('Conta bloqueada');
      }

      // 4. Gerar novos tokens (token rotation)
      const newAccessToken = await this.generateAccessToken(session.user);
      const newRefreshToken = await this.generateRefreshToken(session.user);

      // 5. Atualizar sessão com novo refresh token
      await this.prisma.userSession.update({
        where: { sessionId: session.sessionId },
        data: {
          refreshTokenHash: newRefreshToken,
          rotatedFromJti: session.jwtId,
        },
      });

      // 6. Registar a renovação de token
      await this.recordLoginAttempt(session.userId, true, 'TOKEN_REFRESH');

      // 7. Preparar dados do utilizador
      const userData = {
        userId: session.user.userId,
        username: session.user.username,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        roles: session.user.userRoles.map((ur) => ur.role.roleName),
      };

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60, // 15 minutos em segundos
        user: userData,
      };
    } catch (error) {
      // Registar tentativa falhada se conseguirmos identificar o utilizador
      try {
        const decoded = this.jwtService.decode(
          refreshToken,
        ) as RefreshTokenPayload | null;
        if (decoded?.sub) {
          await this.recordLoginAttempt(
            decoded.sub,
            false,
            'TOKEN_REFRESH_FAILED',
          );
        }
      } catch {
        // Ignorar erro de decodificação se token estiver muito corrompido
      }

      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  /**
   * Fazer logout - invalidar refresh token e sessão
   */
  async logout(refreshToken: string, userId: number): Promise<void> {
    try {
      // 1. Buscar sessão com o refresh token
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: userId,
          refreshTokenHash: refreshToken,
          isRevoked: false,
        },
      });

      if (session) {
        // 2. Marcar sessão como revogada
        await this.prisma.userSession.update({
          where: { sessionId: session.sessionId },
          data: {
            isRevoked: true,
            logoutAt: new Date(),
          },
        });

        this.logger.log(
          `Session revoked for user ${userId} (Session ID: ${session.sessionId})`,
        );
      } else {
        // Mesmo que não encontre a sessão, considera logout bem-sucedido
        this.logger.warn(
          `Logout attempt for user ${userId} but no active session found`,
        );
      }

      // 3. Registar logout
      await this.recordLoginAttempt(userId, true, 'LOGOUT');

      this.logger.log(`Successful logout for user ${userId}`);
    } catch (error) {
      // Registar tentativa de logout falhada
      await this.recordLoginAttempt(userId, false, 'LOGOUT_FAILED');

      this.logger.error(`Logout failed for user ${userId}:`, error);
      throw new UnauthorizedException('Erro ao fazer logout');
    }
  }

  /**
   * Alterar password do utilizador
   */
  async changePassword(
    userId: number,
    currentPassword: string | undefined,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    try {
      // 1. Validar confirmação de password
      if (newPassword !== confirmPassword) {
        throw new UnauthorizedException(
          'Nova password e confirmação não coincidem',
        );
      }

      // 2. Buscar utilizador
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new UnauthorizedException('Utilizador não encontrado');
      }

      // 3. Verificar se utilizador está bloqueado
      if (user.userIsLocked) {
        throw new UnauthorizedException('Conta bloqueada');
      }

      // 4. Verificar se é primeiro acesso (sem password definida)
      const isFirstTimeSetup = !user.passwordHash;

      if (!isFirstTimeSetup) {
        // Utilizador já tem password - validar password atual
        if (!currentPassword) {
          throw new UnauthorizedException('Password atual é obrigatória');
        }

        const isCurrentPasswordValid = await this.usersService.validatePassword(
          currentPassword,
          user.passwordHash,
        );

        if (!isCurrentPasswordValid) {
          this.logger.warn(
            `Invalid current password attempt for user: ${user.username} (ID: ${user.userId})`,
          );

          // Registar tentativa falhada
          await this.recordLoginAttempt(
            userId,
            false,
            'CHANGE_PASSWORD_FAILED',
          );

          throw new UnauthorizedException('Password atual incorreta');
        }
      } else {
        // Primeiro acesso - currentPassword não é necessária
        this.logger.log(
          `First-time password setup for user: ${user.username} (ID: ${user.userId})`,
        );
      }

      // 5. Validar política de password
      const policyValidation = await this.passwordPolicyService.validatePasswordPolicy(
        userId,
        newPassword,
      );

      if (!policyValidation.isValid) {
        this.logger.warn(
          `Password policy validation failed for user ${userId}: ${policyValidation.errors.join(', ')}`,
        );
        throw new BadRequestException(policyValidation.errors.join(' '));
      }

      this.logger.log(
        `Password strength for user ${userId}: ${policyValidation.strength.level} (${policyValidation.strength.score}/100)`,
      );

      // 6. Definir nova password
      await this.usersService.updatePassword(userId, newPassword);

      // 6. Se não é primeiro acesso, invalidar todas as sessões ativas (exceto a atual seria ideal)
      if (!isFirstTimeSetup) {
        await this.prisma.userSession.updateMany({
          where: {
            userId: userId,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            logoutAt: new Date(),
          },
        });

        this.logger.log(
          `All sessions invalidated for user ${userId} after password change`,
        );
      }

      // 7. Registar mudança de password
      await this.recordLoginAttempt(
        userId,
        true,
        isFirstTimeSetup ? 'FIRST_PASSWORD_SET' : 'PASSWORD_CHANGED',
      );

      this.logger.log(
        `Password ${isFirstTimeSetup ? 'set for first time' : 'changed'} for user ${userId}`,
      );
    } catch (error) {
      // Registar tentativa falhada
      await this.recordLoginAttempt(userId, false, 'CHANGE_PASSWORD_FAILED');

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Change password failed for user ${userId}:`, error);
      throw new UnauthorizedException('Erro ao alterar password');
    }
  }

  /**
   * Criar sessão do utilizador
   */
  private async createSession(
    userId: number,
    accessToken: string,
    refreshToken: string,
  ) {
    // Decodificar token para obter JTI
    const decoded = this.jwtService.decode(accessToken) as any;

    await this.prisma.userSession.create({
      data: {
        userId,
        jwtId: decoded.jti || `jwt_${Date.now()}_${userId}`,
        loginAt: new Date(),
        ipAddress: '0.0.0.0', // TODO: Capturar IP real do request
        refreshTokenHash: refreshToken, // TODO: Hash do refresh token
      },
    });
  }

  /**
   * Registar tentativa de login
   */
  private async recordLoginAttempt(
    userId: number,
    isSuccessful: boolean,
    action: string,
  ) {
    await this.prisma.loginAttempt.create({
      data: {
        userId,
        isSuccessful,
        action,
        ipAddress: '0.0.0.0', // TODO: Capturar IP real
        attemptAt: new Date(),
      },
    });
  }

  /**
   * Definir primeira password para utilizador sem password
   */
  async setFirstPassword(
    username: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    this.logger.log(`Setting first password for user: ${username}`);

    // Validar que as passwords coincidem
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('As passwords não coincidem');
    }

    // Procurar utilizador por username
    const user = (await this.usersService.findByUsername(
      username,
    )) as UserWithRelations | null;
    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado');
    }

    // Verificar se o utilizador já tem password
    if (user.passwordHash) {
      throw new BadRequestException(
        'Utilizador já tem password definida. Use o endpoint de change-password.',
      );
    }

    // Definir nova password
    await this.usersService.updatePassword(user.userId, newPassword);

    this.logger.log(
      `First password set successfully for user: ${username} (ID: ${user.userId})`,
    );

    return {
      message: 'Password definida com sucesso',
      success: true,
    };
  }

  /**
   * Obter perfil completo do utilizador autenticado
   */
  async getUserProfile(userId: number) {
    this.logger.log(`Getting user profile for user ID: ${userId}`);

    const user = (await this.usersService.findById(userId)) as any;
    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado');
    }

    return {
      message: 'Perfil do utilizador obtido com sucesso',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstname || null,
        lastName: user.lastname || null,
        phoneNumber: null, // Campo não existe na BD atual
        userIsLocked: user.userIsLocked,
        lastLoginAt: user.userLastLogin,
        passwordChangedAt: null, // Campo não existe na BD atual
        createdAt: user.userCreatedAt,
        updatedAt: user.userUpdatedAt,
        roles: user.userRoles.map((ur) => ur.role.roleName),
        userStatus: user.userStatus
          ? {
              userStatusId: user.userStatus.statusId,
              statusName: user.userStatus.statusName,
              statusDescription: user.userStatus.statusDescription,
              isActive: true, // Campo não existe no userStatus, assumindo true para ACTIVE
            }
          : null,
      },
    };
  }

  /**
   * Verificar tentativas falhadas e bloquear utilizador se necessário
   */
  private async checkAndLockUser(userId: number) {
    const maxAttempts =
      this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5;
    const lockoutDuration =
      this.configService.get<number>('LOCKOUT_DURATION') || 900000; // 15 min

    // Contar tentativas falhadas nos últimos X minutos
    const recentFailedAttempts = await this.prisma.loginAttempt.count({
      where: {
        userId,
        isSuccessful: false,
        attemptAt: {
          gte: new Date(Date.now() - lockoutDuration),
        },
      },
    });

    // Se exceder o limite, bloquear utilizador
    if (recentFailedAttempts >= maxAttempts) {
      await this.usersService.lockUser(userId);
      this.logger.warn(
        `User ${userId} locked due to ${recentFailedAttempts} failed login attempts`,
      );
    }
  }
}
