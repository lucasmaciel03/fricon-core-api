import { UnauthorizedException } from '@nestjs/common';

export class UserLockedException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: 401,
      message: 'Conta bloqueada',
      error: 'UserLocked',
      description:
        'Esta conta foi bloqueada devido a múltiplas tentativas de login falhadas. Entre em contacto com o administrador.',
    });
  }
}
