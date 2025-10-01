.PHONY: help build up down restart logs clean health tools

# Default target
help: ## Show this help message
	@echo "Fricon Core API - Docker Commands"
	@echo "=================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Core commands
build: ## Build the Docker images
	docker-compose build --no-cache

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

logs-api: ## Show logs for API only
	docker-compose logs -f fricon-core-api

# Development commands
dev: ## Start services in development mode (with rebuild)
	docker-compose up --build -d

dev-logs: ## Start services and follow logs
	docker-compose up --build

# Health and status
health: ## Check health status of all services
	@echo "=== Service Health Status ==="
	@docker-compose ps
	@echo ""
	@echo "=== API Health Check ==="
	@curl -s http://localhost:3000/api/v1/health || echo "API not responding"
	@echo ""
	@echo "=== Readiness Check ==="
	@curl -s http://localhost:3000/api/v1/health/ready || echo "Dependencies not ready"

status: ## Show service status
	docker-compose ps

# Database commands
db-migrate: ## Run database migrations
	docker-compose exec fricon-core-api npx prisma migrate deploy

db-seed: ## Seed the database
	docker-compose exec fricon-core-api npm run db:seed

db-reset: ## Reset database (WARNING: deletes all data)
	docker-compose exec fricon-core-api npx prisma migrate reset --force

# Management tools
tools: ## Start management tools (PgAdmin & Redis Commander)
	docker-compose --profile tools up -d pgadmin redis-commander

tools-down: ## Stop management tools
	docker-compose --profile tools down pgadmin redis-commander

# Maintenance
clean: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up everything (including images)
	docker-compose down -v --rmi all
	docker system prune -a -f
	docker volume prune -f

# Backup and restore
backup-db: ## Backup database
	docker-compose exec postgres pg_dump -U fricon fricon_core > backup_$$(date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database (specify BACKUP_FILE=filename.sql)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Usage: make restore-db BACKUP_FILE=backup.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U fricon fricon_core < $(BACKUP_FILE)

# Quick actions
quick-start: build up health ## Build, start and check health
quick-restart: down up health ## Stop, start and check health