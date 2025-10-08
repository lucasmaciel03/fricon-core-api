import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../core/database/prisma.service';
import { PasswordNotSetException, UserLockedException } from './exceptions';
import { LoginDto, LoginResponseDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validar credenciais do utilizador
   * Retorna o utilizador se válido, null caso contrário
   */
  async validateUser(identifier: string, password: string) {
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
        firstname: user.firstname,
        lastname: user.lastname,
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
