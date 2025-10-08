import { FastifyAdapter } from '@nestjs/platform-fastify';

export function createFastifyAdapter(): FastifyAdapter {
  return new FastifyAdapter({
    logger: false, // Usar Pino em vez do logger padrão do Fastify
    trustProxy: true, // Para proxies reversos (nginx, load balancers)

    // Configurações de performance
    keepAliveTimeout: 65000, // Timeout para keep-alive connections
    maxParamLength: 100, // Limite de tamanho dos parâmetros
    bodyLimit: 10 * 1024 * 1024, // Limite de 10MB para o body das requisições

    // Configurações de conexão
    connectionTimeout: 30000, // Timeout de conexão
    pluginTimeout: 30000, // Timeout para plugins

    // Configurações avançadas
    ignoreTrailingSlash: true, // Ignorar barra no final das URLs
    caseSensitive: false, // URLs case-insensitive

    // Configurações de servidor
    serverFactory: (handler, opts) => {
      const server = require('http').createServer(handler);

      // Configurações do servidor HTTP
      server.keepAliveTimeout = 65000;
      server.headersTimeout = 66000;

      return server;
    },
  });
}

export const fastifyConfig = {
  // Configurações específicas do Fastify para produção
  production: {
    disableRequestLogging: true,
    maxParamLength: 50,
    bodyLimit: 5 * 1024 * 1024, // 5MB em produção
  },

  // Configurações para desenvolvimento
  development: {
    disableRequestLogging: false,
    maxParamLength: 200,
    bodyLimit: 50 * 1024 * 1024, // 50MB em desenvolvimento
  },
};
