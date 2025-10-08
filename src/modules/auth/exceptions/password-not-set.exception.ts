import { UnauthorizedException } from '@nestjs/common';

export class PasswordNotSetException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: 401,
      message: 'Password não definida',
      error: 'PasswordNotSet',
      description:
        'Este utilizador ainda não tem password definida. Por favor, defina a sua password antes de fazer login.',
      action: 'SET_PASSWORD_REQUIRED',
    });
  }
}
