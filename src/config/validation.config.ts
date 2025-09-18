import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    // Transformação automática de tipos
    transform: true,
    transformOptions: {
      enableImplicitConversion: true, // Conversão automática de tipos
    },
    
    // Validação agressiva
    whitelist: true, // Remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // Lança erro se propriedades não permitidas forem enviadas
    forbidUnknownValues: true, // Proíbe valores desconhecidos
    
    // Validação de arrays e objetos aninhados
    validateCustomDecorators: true,
    
    // Configuração de erro personalizada
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      const errors = flattenValidationErrors(validationErrors);
      return new BadRequestException({
        statusCode: 400,
        message: 'Dados de entrada inválidos',
        errors,
        timestamp: new Date().toISOString(),
      });
    },
    
    // Validação detalhada
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
    
    // Limites de validação
    stopAtFirstError: false, // Retorna todos os erros, não apenas o primeiro
  });
}

function flattenValidationErrors(validationErrors: ValidationError[]): any {
  const errors: any = {};
  
  validationErrors.forEach((error) => {
    if (error.constraints) {
      errors[error.property] = Object.values(error.constraints);
    }
    
    if (error.children && error.children.length > 0) {
      const childErrors = flattenValidationErrors(error.children);
      Object.keys(childErrors).forEach((key) => {
        errors[`${error.property}.${key}`] = childErrors[key];
      });
    }
  });
  
  return errors;
}

// Decorators personalizados para validação adicional
export const ValidationMessages = {
  IS_NOT_EMPTY: 'Campo obrigatório',
  IS_STRING: 'Deve ser uma string',
  IS_NUMBER: 'Deve ser um número',
  IS_EMAIL: 'Deve ser um email válido',
  IS_UUID: 'Deve ser um UUID válido',
  MIN_LENGTH: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
  IS_POSITIVE: 'Deve ser um número positivo',
  IS_DATE: 'Deve ser uma data válida',
  MATCHES: 'Formato inválido',
};
