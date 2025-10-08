import { plainToInstance } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

class EnvVars {
  @IsEnum(NodeEnv) NODE_ENV!: NodeEnv;

  @IsInt() @Min(1) PORT!: number;

  @IsString() APP_NAME!: string;

  // Database
  @IsOptional() @IsString() DATABASE_URL?: string;

  // JWT Configuration
  @IsOptional() @IsString() JWT_SECRET?: string;
  @IsOptional() @IsString() JWT_ACCESS_TOKEN_EXPIRATION?: string;
  @IsOptional() @IsString() JWT_REFRESH_TOKEN_EXPIRATION?: string;

  // Security
  @IsOptional() @IsInt() BCRYPT_ROUNDS?: number;
  @IsOptional() @IsInt() MAX_LOGIN_ATTEMPTS?: number;
  @IsOptional() @IsInt() LOCKOUT_DURATION?: number;

  // Redis (already in use by health checks)
  @IsOptional() @IsString() REDIS_HOST?: string;
  @IsOptional() @IsInt() REDIS_PORT?: number;
  @IsOptional() @IsString() REDIS_PASSWORD?: string;

  // CORS
  @IsOptional() @IsString() CORS_ORIGINS?: string;
}

export function validate(config: Record<string, unknown>) {
  const env = plainToInstance(EnvVars, {
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: +(config.PORT ?? 3000),
    APP_NAME: config.APP_NAME ?? 'fricon-core-api',
    DATABASE_URL: config.DATABASE_URL,

    // JWT
    JWT_SECRET: config.JWT_SECRET,
    JWT_ACCESS_TOKEN_EXPIRATION: config.JWT_ACCESS_TOKEN_EXPIRATION ?? '15m',
    JWT_REFRESH_TOKEN_EXPIRATION: config.JWT_REFRESH_TOKEN_EXPIRATION ?? '7d',

    // Security
    BCRYPT_ROUNDS: config.BCRYPT_ROUNDS ? +config.BCRYPT_ROUNDS : 10,
    MAX_LOGIN_ATTEMPTS: config.MAX_LOGIN_ATTEMPTS
      ? +config.MAX_LOGIN_ATTEMPTS
      : 5,
    LOCKOUT_DURATION: config.LOCKOUT_DURATION
      ? +config.LOCKOUT_DURATION
      : 900000, // 15 minutes

    // Redis
    REDIS_HOST: config.REDIS_HOST ?? 'localhost',
    REDIS_PORT: config.REDIS_PORT ? +config.REDIS_PORT : 6379,
    REDIS_PASSWORD: config.REDIS_PASSWORD,

    // CORS
    CORS_ORIGINS: config.CORS_ORIGINS,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return env;
}
