module.exports = {
  apps: [
    {
      name: 'fricon-core-api',
      script: 'dist/src/main.js',
      instances: 1, // Número de instâncias (1 para desenvolvimento, 'max' para produção)
      autorestart: true,
      watch: false, // Não assistir arquivos em produção
      max_memory_restart: '1G', // Reiniciar se usar mais de 1GB
      env: {
        NODE_ENV: 'production',
        PORT: 4243,
        HOST: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4243,
        HOST: '0.0.0.0',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4243,
        HOST: '0.0.0.0',
      },
      // Configuração de logs
      log_file: './logs/pm2/combined.log',
      out_file: './logs/pm2/out.log',
      error_file: './logs/pm2/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Configuração de cluster (opcional)
      exec_mode: 'fork', // 'fork' para single instance, 'cluster' para multi-core
      // Configuração de health checks
      health_check: {
        enabled: true,
        url: 'http://localhost:4243/api/v1/health',
        interval: 30000, // 30 segundos
        timeout: 5000,   // 5 segundos
        retries: 3,
      },
    },
  ],
  // Configuração global do PM2
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:lucasmaciel03/fricon-core-api.git',
      path: '/var/www/fricon-core-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};