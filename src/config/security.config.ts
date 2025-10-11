import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  corsOrigins: string[];
  maxPayloadSize: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  enableDetailedErrors: boolean;
}

export function getSecurityConfig(
  configService: ConfigService,
): SecurityConfig {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  // CORS Origins - lista branca baseada em environment
  const corsOriginsEnv = configService.get<string>('CORS_ORIGINS', '');
  const corsOrigins =
    corsOriginsEnv === '*'
      ? ['*'] // Permitir todas as origens
      : corsOriginsEnv
        ? corsOriginsEnv.split(',').map((origin) => origin.trim())
        : isProduction
          ? [] // Em produção, deve ser explicitamente configurado
          : [
              'http://localhost:3000',
              'http://localhost:3001',
              'http://127.0.0.1:3000',
            ];

  return {
    corsOrigins,
    maxPayloadSize: isProduction
      ? 5 * 1024 * 1024 // 5MB em produção
      : 50 * 1024 * 1024, // 50MB em desenvolvimento
    rateLimitMax: isProduction ? 100 : 1000, // Requests por janela
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
    enableDetailedErrors: !isProduction,
  };
}

export function getCorsConfig(corsOrigins: string[]) {
  return {
    origin: corsOrigins.includes('*')
      ? true
      : corsOrigins.length > 0
        ? corsOrigins
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-Id',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Request-Id', 'X-Total-Count'],
    maxAge: 86400, // 24 horas para preflight cache
  };
}

export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [`'self'`],
      styleSrc: [`'self'`, `'unsafe-inline'`, 'fonts.googleapis.com'],
      scriptSrc: [`'self'`, `'unsafe-inline'`],
      fontSrc: [`'self'`, 'fonts.gstatic.com'],
      imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
      connectSrc: [`'self'`],
      objectSrc: [`'none'`],
      mediaSrc: [`'self'`],
      frameSrc: [`'none'`],
    },
  },
  crossOriginEmbedderPolicy: false, // Pode causar problemas com Swagger
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
};
