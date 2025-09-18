import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createFastifyAdapter } from './config/fastify.config';
import { getSecurityConfig, getCorsConfig, helmetConfig } from './config/security.config';
import { createValidationPipe } from './config/validation.config';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';

async function bootstrap() {
  const fastifyAdapter = createFastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    { bufferLogs: true },
  );

  // Obter configurações de segurança
  const configService = app.get(ConfigService);
  const securityConfig = getSecurityConfig(configService);
  const corsConfig = getCorsConfig(securityConfig.corsOrigins);

  // Registrar plugins do Fastify para segurança e compressão
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  await app.register(require('@fastify/helmet'), helmetConfig);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  await app.register(require('@fastify/compress'), {
    encodings: ['gzip', 'deflate', 'br'],
    threshold: 1024, // Comprimir apenas arquivos > 1KB
  });

  // Configurar filtros globais e logger
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());
  app.useLogger(app.get(Logger));

  // Configurar interceptors globais
  app.useGlobalInterceptors(new SanitizeInterceptor());

  // Configurar CORS com lista branca
  app.enableCors(corsConfig);

  // Configurar prefixo global e versionamento
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/docs', '/docs-json'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Configurar pipes globais com validação agressiva
  app.useGlobalPipes(createValidationPipe());

  // Swagger apenas em desenvolvimento
  if (configService.get('NODE_ENV') !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const docConfig = new DocumentBuilder()
      .setTitle(configService.get('APP_NAME') ?? 'Fricon Core API')
      .setDescription('API para gestão de infraestrutura da empresa')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: false,
    });
  }

  const port = configService.get<number>('PORT') ?? 3000;
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 Fastify server running on http://${host}:${port}`);
  console.log(`📚 API docs available at http://${host}:${port}/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
