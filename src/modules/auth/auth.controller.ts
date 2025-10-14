import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshService } from './refresh.service';
import type { FastifyRequest } from 'fastify';
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  LogoutDto,
  ChangePasswordDto,
  SetFirstPasswordDto,
  UserProfileResponseDto,
} from './dto';
import { Public, CurrentUser } from './decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AuditAction,
  AuditEntity,
} from '../../common/interceptors/audit.interceptor';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshService: RefreshService,
  ) {}

  /**
   * POST /auth/login
   * Login com username ou email + password
   */
  @Public()
  @Post('login')
  @AuditAction('LOGIN')
  @AuditEntity('USER')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: FastifyRequest,
  ): Promise<LoginResponseDto> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  /**
   * POST /auth/refresh
   * Renovar access token usando refresh token
   */
  @Public()
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: FastifyRequest,
  ): Promise<RefreshTokenResponseDto> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    return this.refreshService.refreshToken(
      refreshTokenDto,
      ipAddress,
      userAgent,
    );
  }

  /**
   * POST /auth/logout
   * Fazer logout - invalidar refresh token e sessão
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @AuditAction('LOGOUT')
  @AuditEntity('USER')
  async logout(
    @Body() logoutDto: LogoutDto,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.authService.logout(logoutDto.refresh_token, user.userId);
    return {
      message: 'Logout realizado com sucesso',
    };
  }

  /**
   * POST /auth/change-password
   * Alterar password do utilizador autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
    );

    return {
      message: 'Password alterada com sucesso',
    };
  }

  /**
   * POST /auth/set-first-password
   * Definir primeira password para utilizador sem password
   */
  @Public()
  @Post('set-first-password')
  async setFirstPassword(@Body() setFirstPasswordDto: SetFirstPasswordDto) {
    return this.authService.setFirstPassword(
      setFirstPasswordDto.username,
      setFirstPasswordDto.newPassword,
      setFirstPasswordDto.confirmPassword,
    );
  }

  /**
   * GET /auth/me
   * Obter perfil completo do utilizador autenticado (requer JWT)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any): Promise<UserProfileResponseDto> {
    return this.authService.getUserProfile(user.userId);
  }

  /**
   * Obter IP do cliente
   */
  private getClientIp(request: FastifyRequest): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      '127.0.0.1'
    );
  }
}
