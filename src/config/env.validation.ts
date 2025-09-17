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

  // exemplos para crescer depois:
  @IsOptional() @IsString() DATABASE_URL?: string;
  @IsOptional() @IsString() JWT_SECRET?: string;
}

export function validate(config: Record<string, unknown>) {
  const env = plainToInstance(EnvVars, {
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: +(config.PORT ?? 3000),
    APP_NAME: config.APP_NAME ?? 'fricon-core-api',
    DATABASE_URL: config.DATABASE_URL,
    JWT_SECRET: config.JWT_SECRET,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return env;
}
