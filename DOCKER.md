# Fricon Core API - Docker Setup

Este documento explica como executar a Fricon Core API usando Docker Compose.

## 🚀 Quick Start

```bash
# 1. Clonar e navegar para o projeto
cd fricon-core-api

# 2. Copiar configuração Docker
cp .env.docker .env

# 3. Construir e iniciar todos os serviços
make quick-start
# ou
docker-compose up --build -d

# 4. Verificar saúde dos serviços
make health
```

## 📦 Serviços Incluídos

| Serviço | Container | Porta | Descrição |
|---------|-----------|-------|-----------|
| **fricon-core-api** | `fricon-core-api` | `3000` | API principal Nest.js |
| **postgres** | `fricon-postgres` | `5432` | Base de dados PostgreSQL |
| **redis** | `fricon-redis` | `6379` | Cache Redis |
| **pgadmin** | `fricon-pgadmin` | `5050` | Interface PostgreSQL (opcional) |
| **redis-commander** | `fricon-redis-commander` | `8081` | Interface Redis (opcional) |

## 🔧 Comandos Úteis

### Comandos Básicos
```bash
# Iniciar serviços
make up
docker-compose up -d

# Parar serviços  
make down
docker-compose down

# Ver logs
make logs
docker-compose logs -f fricon-core-api

# Reiniciar
make restart
```

### Desenvolvimento
```bash
# Modo desenvolvimento (rebuild automático)
make dev

# Desenvolvimento com logs
make dev-logs
```

### Verificação de Saúde
```bash
# Status dos containers
make status

# Health checks completos
make health

# Testar endpoints
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/health/ready
curl http://localhost:3000/api/v1/health/live
```

### Base de Dados
```bash
# Executar migrações
make db-migrate

# Seed da base
make db-seed  

# Reset completo (CUIDADO!)
make db-reset
```

### Ferramentas de Gestão
```bash
# Iniciar PgAdmin + Redis Commander
make tools

# Aceder às interfaces
open http://localhost:5050  # PgAdmin
open http://localhost:8081  # Redis Commander
```

## 🌐 URLs de Acesso

### API Endpoints
- **API Base:** http://localhost:3000/api/v1/
- **Health Check:** http://localhost:3000/api/v1/health
- **Readiness:** http://localhost:3000/api/v1/health/ready
- **Liveness:** http://localhost:3000/api/v1/health/live
- **Swagger Docs:** http://localhost:3000/docs *(em desenvolvimento)*

### Ferramentas de Gestão
- **PgAdmin:** http://localhost:5050
  - Email: `admin@fricon.com`
  - Password: `admin_password`
- **Redis Commander:** http://localhost:8081
  - User: `admin`
  - Password: `admin_password`

## ⚙️ Configuração

### Variáveis de Ambiente

Copie `.env.docker` para `.env` e ajuste conforme necessário:

```bash
# Configuração do servidor
PORT=3000
NODE_ENV=production

# Base de dados
DATABASE_URL=postgresql://fricon:fricon_password@postgres:5432/fricon_core

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# CORS (ajustar para produção)
CORS_ORIGINS=http://localhost:3001,http://localhost:8080
```

### Profiles Docker

```bash
# Serviços principais apenas
docker-compose up -d

# Incluir ferramentas de gestão
docker-compose --profile tools up -d
```

## 🔒 Segurança

### Credenciais Padrão (ALTERAR EM PRODUÇÃO!)

- **PostgreSQL:** `fricon:fricon_password`
- **Redis:** `redis_password`  
- **PgAdmin:** `admin@fricon.com:admin_password`
- **Redis Commander:** `admin:admin_password`

### Para Produção
1. Alterar todas as passwords
2. Usar secrets Docker/Kubernetes
3. Configurar SSL/TLS
4. Restringir acesso às ferramentas de gestão

## 🔧 Troubleshooting

### Problemas Comuns

```bash
# Container não inicia
docker-compose logs fricon-core-api

# Problemas de conectividade
make health

# Limpar cache Docker
make clean

# Reset completo
make clean-all
```

### Health Checks

```bash
# Verificar se API responde
curl -f http://localhost:3000/api/v1/health/live

# Verificar dependências
curl -f http://localhost:3000/api/v1/health/ready
```

## 🚀 Deploy

### Desenvolvimento Local
```bash
make quick-start
```

### Staging/Produção
```bash
# Usar compose específico
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Com orchestração
docker stack deploy -c docker-compose.yml fricon
```

## 📊 Monitorização

A aplicação expõe health checks compatíveis com:
- **Docker Healthchecks**
- **Kubernetes Probes**
- **Load Balancers**
- **Monitoring Tools** (Prometheus, etc.)

### Health Check Endpoints:
- `/api/v1/health/live` → Liveness probe
- `/api/v1/health/ready` → Readiness probe (verifica PostgreSQL + Redis)
- `/api/v1/health` → Basic health status