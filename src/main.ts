import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet()); // segurança
  app.use(compression()); // gzip
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());
  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['/health', '/docs', '/docs-json'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger only on development
  const config = app.get(ConfigService);
  if (config.get('NODE_ENV') !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const docConfig = new DocumentBuilder()
      .setTitle(config.get('APP_NAME') ?? 'API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: false,
    });
  }

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
