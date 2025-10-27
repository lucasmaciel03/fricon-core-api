import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

const path = require('node:path');

const { PrismaClient } = require(
  path.resolve(process.cwd(), 'generated/prisma'),
);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private _connected = false;

  constructor() {
    // Configure connection pool to prevent "too many clients" error
    // Reference: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await this.$connect();
      this._connected = true;
    } catch (error) {
      // Do not crash the application if DB is down at startup.
      // Readiness endpoint will report the DB as unhealthy.

      console.warn(
        'PrismaService: could not connect to database on startup:',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.message ?? error,
      );
      this._connected = false;
    }
  }

  async onModuleDestroy() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$disconnect();
  }

  get isConnected() {
    return this._connected;
  }
}
