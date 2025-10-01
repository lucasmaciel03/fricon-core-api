import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    try {
      const result = await this.health.check([
        async () => this.prismaIndicator.isHealthy('database'),
        async () => this.redisIndicator.isHealthy('redis'),
      ]);

      // If any indicator is down, Terminus will throw HealthCheckError. If we reach here, all good.
      return result;
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'One or more dependencies are unhealthy';

      throw new HttpException(
        { statusCode: HttpStatus.SERVICE_UNAVAILABLE, message },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('live')
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
