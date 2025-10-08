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

  async onModuleInit() {
    try {
      await this.$connect();
      this._connected = true;
    } catch (error) {
      // Do not crash the application if DB is down at startup.
      // Readiness endpoint will report the DB as unhealthy.

      console.warn(
        'PrismaService: could not connect to database on startup:',
        error?.message ?? error,
      );
      this._connected = false;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  get isConnected() {
    return this._connected;
  }
}
