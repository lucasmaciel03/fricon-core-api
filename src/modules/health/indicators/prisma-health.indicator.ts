import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if PrismaService was able to connect during startup
      if (!this.prisma.isConnected) {
        throw new Error('Database connection not established during startup');
      }

      // Tenta fazer uma query simples para verificar a conexão
      await this.prisma.$queryRaw`SELECT 1`;

      // Verifica se consegue acessar as tabelas do sistema
      const result = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*)::text as table_count 
        FROM information_schema.tables 
        WHERE table_schema = current_schema()
      `;

      const isHealthy = Array.isArray(result) && result.length > 0;

      if (isHealthy) {
        return this.getStatus(key, true, {
          message: 'Database connection is healthy',
          tables: Number(result[0]?.table_count || 0),
          connection: 'active',
        });
      }

      throw new Error('Database query returned unexpected result');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';

      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message: errorMessage,
          connection: 'failed',
        }),
      );
    }
  }
}
