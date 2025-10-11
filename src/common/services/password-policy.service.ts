import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verificar se a password já foi usada nas últimas N passwords
   */
  async isPasswordReused(userId: number, newPassword: string, lastCount = 5): Promise<boolean> {
    try {
      // Buscar as últimas passwords do utilizador
      const passwordHistory = await this.prisma.userPasswordHistory.findMany({
        where: { userId },
        orderBy: { changedAt: 'desc' },
        take: lastCount,
        select: { passwordHash: true },
      });

      // Verificar se a nova password é igual a alguma das anteriores
      for (const historicPassword of passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, historicPassword.passwordHash);
        if (isMatch) {
          return true; // Password já foi usada
        }
      }

      return false; // Password não foi usada anteriormente
    } catch (error) {
      console.error('Erro ao verificar histórico de passwords:', error);
      return false; // Em caso de erro, permitir a password
    }
  }

  /**
   * Calcular força da password (0-100)
   */
  calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let score = 0;

    // Comprimento (máximo 25 pontos)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;

    // Caracteres minúsculos (10 pontos)
    if (/[a-z]/.test(password)) score += 10;

    // Caracteres maiúsculos (10 pontos)
    if (/[A-Z]/.test(password)) score += 10;

    // Números (10 pontos)
    if (/\d/.test(password)) score += 10;

    // Símbolos especiais (15 pontos)
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) score += 15;

    // Variedade de caracteres (10 pontos)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 10;

    // Penalizar sequências e repetições
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repetições
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password)) {
      score -= 10; // Sequências
    }

    // Penalizar passwords comuns
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /admin/i,
      /welcome/i,
      /fricon/i,
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 15;
        break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Obter nível de força da password
   */
  getPasswordStrengthLevel(password: string): {
    score: number;
    level: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito Forte';
    color: string;
  } {
    const score = this.calculatePasswordStrength(password);

    if (score < 30) {
      return { score, level: 'Muito Fraca', color: '#ff4444' };
    } else if (score < 50) {
      return { score, level: 'Fraca', color: '#ff8800' };
    } else if (score < 70) {
      return { score, level: 'Média', color: '#ffaa00' };
    } else if (score < 85) {
      return { score, level: 'Forte', color: '#88cc00' };
    } else {
      return { score, level: 'Muito Forte', color: '#00cc44' };
    }
  }

  /**
   * Validar password segundo todas as políticas
   */
  async validatePasswordPolicy(
    userId: number,
    password: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    strength: ReturnType<typeof this.getPasswordStrengthLevel>;
  }> {
    const errors: string[] = [];
    const strength = this.getPasswordStrengthLevel(password);

    // Verificar se foi reutilizada
    const isReused = await this.isPasswordReused(userId, password);
    if (isReused) {
      errors.push('Esta password já foi usada recentemente. Escolha uma password diferente.');
    }

    // Verificar força mínima
    if (strength.score < 50) {
      errors.push(`Password é muito ${strength.level.toLowerCase()}. Escolha uma password mais forte.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }
}