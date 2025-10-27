import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Buscar utilizador por username
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        userStatus: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Buscar utilizador por email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: {
        userStatus: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Buscar utilizador por username OU email
   */
  async findByUsernameOrEmail(identifier: string) {
    // Tentar buscar por username primeiro
    let user = await this.findByUsername(identifier);

    // Se não encontrar e o identifier parece um email, buscar por email
    if (!user && identifier.includes('@')) {
      user = await this.findByEmail(identifier);
    }

    return user;
  }

  /**
   * Buscar utilizador por ID
   */
  async findById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        userStatus: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Listar todos os utilizadores (com roles)
   */
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        userStatus: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Listar utilizadores que possuem a role especificada (roleId ou roleName)
   */
  async findByRole(roleIdentifier: string) {
    // Verifica se é um número (roleId) ou string (roleName)
    const isNumeric = /^\d+$/.test(roleIdentifier);

    return this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: isNumeric
              ? { roleId: parseInt(roleIdentifier, 10) }
              : { roleName: roleIdentifier },
          },
        },
      },
      include: {
        userStatus: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Validar password do utilizador
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash de password
   */
  async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') || 10;
    return bcrypt.hash(password, rounds);
  }

  /**
   * Atualizar password do utilizador
   */
  async updatePassword(userId: number, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);

    // Atualizar password
    const updatedUser = await this.prisma.user.update({
      where: { userId },
      data: {
        passwordHash: hashedPassword,
        userUpdatedAt: new Date(),
      },
    });

    // Guardar no histórico de passwords
    await this.prisma.userPasswordHistory.create({
      data: {
        userId,
        passwordHash: hashedPassword,
      },
    });

    return updatedUser;
  }

  /**
   * Atualizar último login
   */
  async updateLastLogin(userId: number) {
    return this.prisma.user.update({
      where: { userId },
      data: {
        userLastLogin: new Date(),
      },
    });
  }

  /**
   * Verificar se utilizador está bloqueado
   */
  async isUserLocked(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userIsLocked: true },
    });

    return user?.userIsLocked ?? false;
  }

  /**
   * Bloquear utilizador
   */
  async lockUser(userId: number) {
    return this.prisma.user.update({
      where: { userId },
      data: {
        userIsLocked: true,
      },
    });
  }

  /**
   * Desbloquear utilizador
   */
  async unlockUser(userId: number) {
    return this.prisma.user.update({
      where: { userId },
      data: {
        userIsLocked: false,
      },
    });
  }
}
