import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        genReqId: (req) =>
          (req.headers['x-request-id'] as string) ?? crypto.randomUUID(),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
  ],
  exports: [LoggerModule],
})

export class AppLoggerModule {}
