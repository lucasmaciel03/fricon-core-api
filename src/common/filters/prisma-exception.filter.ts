import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Prisma as PrismaNS } from '../../../generated/prisma';
// At runtime (compiled to dist), resolve the generated client from project root
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('node:path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Prisma } = require(path.resolve(process.cwd(), 'generated/prisma'));

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: PrismaNS.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const map: Record<string, { status: number; message: string }> = {
      P2002: {
        status: HttpStatus.CONFLICT,
        message: 'Recurso já existe (violação de unicidade)',
      },
      P2025: {
        status: HttpStatus.NOT_FOUND,
        message: 'Recurso não encontrado',
      },
      P2003: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Referência inválida (FK)',
      },
    };
    const out = map[e.code] ?? {
      status: 400,
      message: 'Erro de base de dados',
    };
    res
      .status(out.status)
      .json({ statusCode: out.status, message: out.message, code: e.code });
  }
}
