# Configurações de Segurança - Fricon Core API

## 🚀 Fastify Performance & Security

A API foi migrada do Express para Fastify para melhor performance e segurança nativa.

### Melhorias de Performance:
- **Fastify Adapter**: ~65% mais rápido que Express
- **Compressão**: gzip, deflate, brotli com threshold de 1KB
- **Keep-Alive**: Configurado para 65s
- **Body Limit**: 5MB em produção, 50MB em desenvolvimento

## 🔒 Configurações de Segurança

### 1. CORS (Cross-Origin Resource Sharing)
- **Lista Branca**: Configurada via `CORS_ORIGINS` environment variable
- **Produção**: Deve ser explicitamente configurado
- **Desenvolvimento**: Permite localhost por padrão
- **Credenciais**: Habilitado para autenticação

```env
# Exemplo para produção
CORS_ORIGINS=https://app.fricon.com,https://admin.fricon.com
```

### 2. Headers de Segurança
- **X-Request-Id**: Gerado automaticamente para rastreamento
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restringe geolocation, microphone, camera
- **Cache-Control**: no-cache para APIs
- **Remove**: X-Powered-By, Server headers

### 3. Content Security Policy (CSP)
```javascript
{
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  fontSrc: ["'self'", "fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "validator.swagger.io"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"]
}
```

### 4. Sanitização XSS
- **Interceptor Global**: `SanitizeInterceptor`
- **Input Sanitization**: Remove scripts maliciosos de body, query, params
- **Output Sanitization**: Permite HTML básico em respostas
- **Biblioteca**: xss com configuração customizada

### 5. Validação Agressiva
- **DTO Validation**: `forbidNonWhitelisted: true`
- **Transform**: Conversão automática de tipos
- **Custom Messages**: Mensagens em português
- **Nested Validation**: Objetos e arrays aninhados
- **Error Details**: Retorna todos os erros de validação

### 6. Rate Limiting (Configurado)
- **Produção**: 100 requests por 15 minutos
- **Desenvolvimento**: 1000 requests por 15 minutos

## 🛡️ Helmet Security Headers

### Configurações Aplicadas:
- **HSTS**: 1 ano com includeSubDomains e preload
- **No Sniff**: Previne MIME type sniffing
- **Frame Guard**: DENY para prevenir clickjacking
- **XSS Filter**: Habilitado
- **Referrer Policy**: strict-origin-when-cross-origin

## 📝 Variáveis de Ambiente

### Obrigatórias para Produção:
```env
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com
DATABASE_URL=postgresql://...
```

### Opcionais:
```env
PORT=3000
HOST=0.0.0.0
APP_NAME=Fricon Core API
```

## 🔧 Configurações por Ambiente

### Desenvolvimento:
- CORS: Permite localhost
- Body Limit: 50MB
- Detailed Errors: Habilitado
- Swagger: Habilitado

### Produção:
- CORS: Lista branca obrigatória
- Body Limit: 5MB
- Detailed Errors: Desabilitado
- Swagger: Desabilitado

## 🚨 Alertas de Segurança

### ⚠️ Importante:
1. **CORS_ORIGINS** deve ser configurado em produção
2. **DATABASE_URL** deve usar SSL em produção
3. **Secrets** nunca devem ser commitados
4. **Rate Limiting** pode precisar ajustes baseado no uso

### 🔍 Monitoramento:
- Logs estruturados com Pino
- Request ID para rastreamento
- Error tracking com contexto
- Performance metrics disponíveis

## 📚 Recursos Adicionais

- [Fastify Security Best Practices](https://www.fastify.io/docs/latest/Guides/Security/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
