import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditAction } from '../../../generated/prisma';

export interface AuditLogData {
  userId?: number;
  entitySchema?: string;
  entityTable: string;
  entityPk: string;
  action: AuditAction;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
}

export interface ActivityLogData {
  userId: number;
  action: string;
  entityId?: number;
  entityType?: string;
  ipAddress: string;
  sessionId?: string;
  correlationId?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registar uma entrada no log de auditoria
   */
  async logAuditAction(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          entitySchema: data.entitySchema,
          entityTable: data.entityTable,
          entityPk: data.entityPk,
          tableName: data.entityTable, // Para compatibilidade
          action: data.action,
          beforeData: data.beforeData || null,
          afterData: data.afterData || null,
        },
      });
    } catch (error) {
      console.error('Erro ao registar auditoria:', error);
      // Não fazer throw para não quebrar a operação principal
    }
  }

  /**
   * Registar uma atividade do utilizador
   */
  async logUserActivity(data: ActivityLogData): Promise<void> {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityId: data.entityId,
          entityType: data.entityType,
          ipAddress: data.ipAddress,
          sessionId: data.sessionId,
          correlationId: data.correlationId,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Erro ao registar atividade:', error);
      // Não fazer throw para não quebrar a operação principal
    }
  }

  /**
   * Obter logs de auditoria por utilizador
   */
  async getAuditLogsByUser(
    userId: number,
    limit = 50,
    offset = 0,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obter logs de atividade por utilizador
   */
  async getActivityLogsByUser(
    userId: number,
    limit = 50,
    offset = 0,
  ): Promise<any[]> {
    return this.prisma.userActivityLog.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { actionAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obter logs de auditoria por entidade
   */
  async getAuditLogsByEntity(
    entityTable: string,
    entityPk: string,
    limit = 50,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityTable,
        entityPk,
      },
      take: limit,
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Estatísticas de auditoria
   */
  async getAuditStats() {
    const [totalAudits, totalActivities, topUsers, topActions] =
      await Promise.all([
        this.prisma.auditLog.count(),
        this.prisma.userActivityLog.count(),
        this.prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { _all: true },
          orderBy: { _count: { _all: 'desc' } },
          take: 10,
        }),
        this.prisma.userActivityLog.groupBy({
          by: ['action'],
          _count: { _all: true },
          orderBy: { _count: { _all: 'desc' } },
          take: 10,
        }),
      ]);

    return {
      totalAudits,
      totalActivities,
      topUsers,
      topActions,
    };
  }

  /**
   * Limpar logs antigos (política de retenção)
   */
  async cleanupOldLogs(retentionDays = 90): Promise<{
    deletedAudits: number;
    deletedActivities: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const [deletedAudits, deletedActivities] = await Promise.all([
      this.prisma.auditLog.deleteMany({
        where: {
          changedAt: {
            lt: cutoffDate,
          },
        },
      }),
      this.prisma.userActivityLog.deleteMany({
        where: {
          actionAt: {
            lt: cutoffDate,
          },
        },
      }),
    ]);

    return {
      deletedAudits: deletedAudits.count,
      deletedActivities: deletedActivities.count,
    };
  }
}