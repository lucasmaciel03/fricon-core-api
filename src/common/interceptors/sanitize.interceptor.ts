import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { filterXSS } from 'xss';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitizar body da requisição
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // Sanitizar query parameters
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    // Sanitizar params
    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }

    return next.handle().pipe(
      map((data) => {
        // Sanitizar resposta apenas se for string ou objeto com strings
        return this.sanitizeResponse(data);
      }),
    );
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return filterXSS(obj, {
        whiteList: {}, // Remove todas as tags HTML
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeResponse(data: any): any {
    // Apenas sanitizar strings em respostas, não remover HTML válido
    if (typeof data === 'string') {
      return filterXSS(data, {
        whiteList: {
          // Permitir algumas tags HTML básicas em respostas
          p: [],
          br: [],
          strong: [],
          em: [],
          u: [],
        },
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
      });
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeResponse(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeResponse(data[key]);
        }
      }
      return sanitized;
    }

    return data;
  }
}
