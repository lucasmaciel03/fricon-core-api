import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Lista de passwords comuns a evitar
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
      'dragon',
      'princess',
      'password1',
      '123123',
      'welcome123',
      'admin123',
      'qwerty123',
      'fricon',
      'fricon123',
    ];

    // Verificar se não é uma password comum
    if (commonPasswords.includes(password.toLowerCase())) {
      return false;
    }

    // Verificar comprimento mínimo (8 caracteres)
    if (password.length < 8) {
      return false;
    }

    // Verificar se contém pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Verificar se contém pelo menos um número
    if (!/\d/.test(password)) {
      return false;
    }

    // Verificar se contém pelo menos um símbolo especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      return false;
    }

    // Verificar se não tem mais de 2 caracteres consecutivos iguais
    if (/(.)\1{2,}/.test(password)) {
      return false;
    }

    // Verificar se não é uma sequência simples
    const sequences = [
      'abcdefgh',
      'bcdefghi',
      'cdefghij',
      'defghijk',
      'efghijkl',
      'fghijklm',
      'ghijklmn',
      'hijklmno',
      'ijklmnop',
      'jklmnopq',
      'klmnopqr',
      'lmnopqrs',
      'mnopqrst',
      'nopqrstu',
      'opqrstuv',
      'pqrstuvw',
      'qrstuvwx',
      'rstuvwxy',
      'stuvwxyz',
      '12345678',
      '23456789',
      '34567890',
      '87654321',
      '98765432',
      '09876543',
    ];

    for (const sequence of sequences) {
      if (password.toLowerCase().includes(sequence)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const password = args.value as string;

    // Lista de passwords comuns
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
      'dragon',
      'princess',
      'password1',
      '123123',
      'welcome123',
      'admin123',
      'qwerty123',
      'fricon',
      'fricon123',
    ];

    if (!password || typeof password !== 'string') {
      return 'Password é obrigatória';
    }

    if (commonPasswords.includes(password.toLowerCase())) {
      return 'Password é muito comum. Escolha uma password mais segura';
    }

    if (password.length < 8) {
      return 'Password deve ter pelo menos 8 caracteres';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password deve conter pelo menos uma letra minúscula';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password deve conter pelo menos uma letra maiúscula';
    }

    if (!/\d/.test(password)) {
      return 'Password deve conter pelo menos um número';
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      return 'Password deve conter pelo menos um símbolo especial (!@#$%^&*...)';
    }

    if (/(.)\1{2,}/.test(password)) {
      return 'Password não pode ter mais de 2 caracteres consecutivos iguais';
    }

    return 'Password não atende aos critérios de segurança';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}