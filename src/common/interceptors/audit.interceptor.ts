import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuditService } from '../services/audit.service';

// Metadata keys
export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_ENTITY_KEY = 'audit_entity';

// Decorators para marcar endpoints que devem ser auditados
export const AuditAction = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
export const AuditEntity = (entityType: string) => SetMetadata(AUDIT_ENTITY_KEY, entityType);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const handler = context.getHandler();
    const className = context.getClass().name;

    // Obter metadados dos decorators
    const auditAction = this.reflector.get<string>(AUDIT_ACTION_KEY, handler);
    const entityType = this.reflector.get<string>(AUDIT_ENTITY_KEY, handler);

    // Se não tem decorator de auditoria, não regista
    if (!auditAction) {
      return next.handle();
    }

    // Extrair informações do utilizador do JWT (se autenticado)
    const user = (request as any).user;
    const userId = user?.userId || user?.sub;
    
    // Extrair informações da request
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const sessionId = this.extractSessionId(request);
    const correlationId = this.generateCorrelationId();

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Sucesso - registar atividade
          if (userId) {
            void this.auditService.logUserActivity({
              userId: Number(userId),
              action: auditAction,
              entityType,
              entityId: this.extractEntityId(request, response),
              ipAddress,
              sessionId,
              correlationId,
              userAgent,
            });
          }
        },
        error: (error) => {
          // Erro - também registar (para segurança)
          if (userId) {
            void this.auditService.logUserActivity({
              userId: Number(userId),
              action: `${auditAction}_ERROR`,
              entityType,
              ipAddress,
              sessionId,
              correlationId,
              userAgent,
            });
          }
        },
      }),
    );
  }

  private getClientIp(request: FastifyRequest): string {
    // Tentar várias fontes para obter o IP real
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];
    const remoteAddress = request.socket?.remoteAddress;

    if (xForwardedFor) {
      // x-forwarded-for pode ter múltiplos IPs separados por vírgula
      const ips = Array.isArray(xForwardedFor) 
        ? xForwardedFor[0] 
        : xForwardedFor.toString();
      return ips.split(',')[0].trim();
    }

    if (xRealIp) {
      return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp.toString();
    }

    return remoteAddress || '0.0.0.0';
  }

  private extractSessionId(request: FastifyRequest): string | undefined {
    // Tentar extrair sessionId do JWT ou headers
    const authorization = request.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      try {
        const token = authorization.substring(7);
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString(),
        );
        return payload.jti; // JWT ID
      } catch {
        // Ignorar erro de parsing
      }
    }
    return undefined;
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractEntityId(
    request: FastifyRequest,
    response?: any,
  ): number | undefined {
    // Tentar extrair ID da entidade dos parâmetros da URL
    const params = (request as any).params;
    if (params?.id) {
      const id = parseInt(params.id);
      return isNaN(id) ? undefined : id;
    }

    // Tentar extrair do corpo da resposta (para operações CREATE)
    if (response && typeof response === 'object') {
      if (response.userId) return response.userId;
      if (response.id) return response.id;
      if (response.data?.id) return response.data.id;
    }

    return undefined;
  }
}