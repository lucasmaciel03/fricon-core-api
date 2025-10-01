import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import * as net from 'node:net';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly defaultHost = process.env.REDIS_HOST ?? '127.0.0.1';
  private readonly defaultPort = Number(process.env.REDIS_PORT ?? 6379);
  private readonly redisPassword = process.env.REDIS_PASSWORD;

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const host = this.defaultHost;
    const port = this.defaultPort;

    return new Promise<HealthIndicatorResult>((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 2000;

      let settled = false;

      const onError = (err: Error) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        const details = { message: err.message, connection: 'failed' };
        reject(
          new HealthCheckError(
            'Redis check failed',
            this.getStatus(key, false, details),
          ),
        );
      };

      const onTimeout = () => {
        onError(new Error('Redis connection timed out'));
      };

      socket.setTimeout(timeout);
      socket.once('error', onError);
      socket.once('timeout', onTimeout);

      socket.connect(port, host, () => {
        try {
          // Authenticate if password is provided
          if (this.redisPassword) {
            socket.write(`AUTH ${this.redisPassword}\r\n`);
            socket.write('PING\r\n');
          } else {
            socket.write('PING\r\n');
          }
        } catch (err) {
          onError(err as Error);
        }
      });

      socket.once('data', (data: Buffer) => {
        if (settled) return;
        const str = data.toString('utf8').trim();
        // Redis replies: +OK (auth success) or +PONG (ping success)
        if (str.includes('+OK') || str.includes('+PONG') || str === 'PONG') {
          settled = true;
          socket.end();
          resolve(
            this.getStatus(key, true, {
              message: 'Redis is healthy',
              host,
              port,
              authenticated: !!this.redisPassword,
            }),
          );
        } else {
          onError(new Error(`Unexpected Redis reply: ${str}`));
        }
      });
    });
  }
}
