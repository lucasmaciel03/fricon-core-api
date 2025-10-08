-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "log";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "org";

-- CreateEnum
CREATE TYPE "public"."audit_action" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "core"."tbl_user_status" (
    "status_id" SERIAL NOT NULL,
    "status_name" VARCHAR(50) NOT NULL,
    "status_description" TEXT NOT NULL,

    CONSTRAINT "tbl_user_status_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "core"."tbl_users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "lastname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "user_status_id" INTEGER NOT NULL,
    "user_is_locked" BOOLEAN NOT NULL DEFAULT false,
    "user_avatar" VARCHAR(500),
    "user_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "user_last_login" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "core"."tbl_roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "tbl_roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "core"."tbl_user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org"."tbl_factories" (
    "factory_id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "tbl_factories_pkey" PRIMARY KEY ("factory_id")
);

-- CreateTable
CREATE TABLE "org"."tbl_teams" (
    "team_id" SERIAL NOT NULL,
    "factory_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "tbl_teams_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "org"."tbl_departments" (
    "dep_id" SERIAL NOT NULL,
    "factory_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "tbl_departments_pkey" PRIMARY KEY ("dep_id")
);

-- CreateTable
CREATE TABLE "org"."tbl_warehouses" (
    "warehouse_id" SERIAL NOT NULL,
    "factory_id" INTEGER NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "tbl_warehouses_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "org"."tbl_setors" (
    "setor_id" SERIAL NOT NULL,
    "factory_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "acronym" VARCHAR(10),

    CONSTRAINT "tbl_setors_pkey" PRIMARY KEY ("setor_id")
);

-- CreateTable
CREATE TABLE "org"."tbl_user_factories" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "factory_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_factories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org"."tbl_user_teams" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org"."tbl_user_departments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dep_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org"."tbl_user_warehouses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org"."tbl_user_setors" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "setor_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_setors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."tbl_login_attempts" (
    "attempt_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_successful" BOOLEAN NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,

    CONSTRAINT "tbl_login_attempts_pkey" PRIMARY KEY ("attempt_id")
);

-- CreateTable
CREATE TABLE "log"."tbl_user_activity_logs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(200) NOT NULL,
    "entity_id" INTEGER,
    "entity_type" VARCHAR(100),
    "action_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45) NOT NULL,
    "session_id" TEXT,
    "correlation_id" VARCHAR(100),
    "user_agent" TEXT,

    CONSTRAINT "tbl_user_activity_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "auth"."tbl_password_reset_logs" (
    "reset_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reset_token" VARCHAR(255) NOT NULL,
    "request_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,

    CONSTRAINT "tbl_password_reset_logs_pkey" PRIMARY KEY ("reset_id")
);

-- CreateTable
CREATE TABLE "log"."tbl_user_password_history" (
    "history_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_password_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "auth"."tbl_user_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "jwt_id" VARCHAR(255) NOT NULL,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMP(3),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "refresh_token_hash" VARCHAR(255),
    "rotated_from_jti" VARCHAR(255),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "tbl_user_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "auth"."tbl_mfa_tokens" (
    "mfa_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_mfa_tokens_pkey" PRIMARY KEY ("mfa_id")
);

-- CreateTable
CREATE TABLE "auth"."tbl_mfa_factors" (
    "factor_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100),
    "secret" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_mfa_factors_pkey" PRIMARY KEY ("factor_id")
);

-- CreateTable
CREATE TABLE "log"."tbl_audit_logs" (
    "audit_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "entity_schema" VARCHAR(50),
    "entity_table" VARCHAR(100),
    "entity_pk" VARCHAR(100),
    "table_name" VARCHAR(100) NOT NULL,
    "action" "public"."audit_action" NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_audit_logs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_status_status_name_key" ON "core"."tbl_user_status"("status_name");

-- CreateIndex
CREATE INDEX "tbl_user_status_status_name_idx" ON "core"."tbl_user_status"("status_name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_username_key" ON "core"."tbl_users"("username");

-- CreateIndex
CREATE INDEX "tbl_users_email_idx" ON "core"."tbl_users"("email");

-- CreateIndex
CREATE INDEX "tbl_users_user_status_id_idx" ON "core"."tbl_users"("user_status_id");

-- CreateIndex
CREATE INDEX "tbl_users_user_created_at_idx" ON "core"."tbl_users"("user_created_at");

-- CreateIndex
CREATE INDEX "tbl_users_deleted_at_idx" ON "core"."tbl_users"("deleted_at");

-- CreateIndex
CREATE INDEX "tbl_users_user_status_id_user_is_locked_idx" ON "core"."tbl_users"("user_status_id", "user_is_locked");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_roles_role_name_key" ON "core"."tbl_roles"("role_name");

-- CreateIndex
CREATE INDEX "tbl_roles_role_name_idx" ON "core"."tbl_roles"("role_name");

-- CreateIndex
CREATE INDEX "tbl_user_roles_assigned_at_idx" ON "core"."tbl_user_roles"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_roles_user_id_role_id_key" ON "core"."tbl_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "tbl_factories_name_idx" ON "org"."tbl_factories"("name");

-- CreateIndex
CREATE INDEX "tbl_teams_factory_id_idx" ON "org"."tbl_teams"("factory_id");

-- CreateIndex
CREATE INDEX "tbl_teams_name_idx" ON "org"."tbl_teams"("name");

-- CreateIndex
CREATE INDEX "tbl_departments_factory_id_idx" ON "org"."tbl_departments"("factory_id");

-- CreateIndex
CREATE INDEX "tbl_departments_name_idx" ON "org"."tbl_departments"("name");

-- CreateIndex
CREATE INDEX "tbl_warehouses_factory_id_idx" ON "org"."tbl_warehouses"("factory_id");

-- CreateIndex
CREATE INDEX "tbl_warehouses_code_idx" ON "org"."tbl_warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_warehouses_factory_id_code_key" ON "org"."tbl_warehouses"("factory_id", "code");

-- CreateIndex
CREATE INDEX "tbl_setors_factory_id_idx" ON "org"."tbl_setors"("factory_id");

-- CreateIndex
CREATE INDEX "tbl_setors_name_idx" ON "org"."tbl_setors"("name");

-- CreateIndex
CREATE INDEX "tbl_setors_acronym_idx" ON "org"."tbl_setors"("acronym");

-- CreateIndex
CREATE INDEX "tbl_user_factories_assigned_at_idx" ON "org"."tbl_user_factories"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_factories_user_id_factory_id_key" ON "org"."tbl_user_factories"("user_id", "factory_id");

-- CreateIndex
CREATE INDEX "tbl_user_teams_assigned_at_idx" ON "org"."tbl_user_teams"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_teams_user_id_team_id_key" ON "org"."tbl_user_teams"("user_id", "team_id");

-- CreateIndex
CREATE INDEX "tbl_user_departments_assigned_at_idx" ON "org"."tbl_user_departments"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_departments_user_id_dep_id_key" ON "org"."tbl_user_departments"("user_id", "dep_id");

-- CreateIndex
CREATE INDEX "tbl_user_warehouses_assigned_at_idx" ON "org"."tbl_user_warehouses"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_warehouses_user_id_warehouse_id_key" ON "org"."tbl_user_warehouses"("user_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "tbl_user_setors_assigned_at_idx" ON "org"."tbl_user_setors"("assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_setors_user_id_setor_id_key" ON "org"."tbl_user_setors"("user_id", "setor_id");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_user_id_idx" ON "auth"."tbl_login_attempts"("user_id");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_attempt_at_idx" ON "auth"."tbl_login_attempts"("attempt_at");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_ip_address_idx" ON "auth"."tbl_login_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_is_successful_idx" ON "auth"."tbl_login_attempts"("is_successful");

-- CreateIndex
CREATE INDEX "tbl_login_attempts_action_idx" ON "auth"."tbl_login_attempts"("action");

-- CreateIndex
CREATE INDEX "tbl_user_activity_logs_user_id_idx" ON "log"."tbl_user_activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "tbl_user_activity_logs_action_at_idx" ON "log"."tbl_user_activity_logs"("action_at");

-- CreateIndex
CREATE INDEX "tbl_user_activity_logs_action_idx" ON "log"."tbl_user_activity_logs"("action");

-- CreateIndex
CREATE INDEX "tbl_user_activity_logs_entity_type_idx" ON "log"."tbl_user_activity_logs"("entity_type");

-- CreateIndex
CREATE INDEX "tbl_password_reset_logs_user_id_idx" ON "auth"."tbl_password_reset_logs"("user_id");

-- CreateIndex
CREATE INDEX "tbl_password_reset_logs_reset_token_idx" ON "auth"."tbl_password_reset_logs"("reset_token");

-- CreateIndex
CREATE INDEX "tbl_password_reset_logs_request_at_idx" ON "auth"."tbl_password_reset_logs"("request_at");

-- CreateIndex
CREATE INDEX "tbl_user_password_history_user_id_idx" ON "log"."tbl_user_password_history"("user_id");

-- CreateIndex
CREATE INDEX "tbl_user_password_history_changed_at_idx" ON "log"."tbl_user_password_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_sessions_jwt_id_key" ON "auth"."tbl_user_sessions"("jwt_id");

-- CreateIndex
CREATE INDEX "tbl_user_sessions_user_id_idx" ON "auth"."tbl_user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "tbl_user_sessions_jwt_id_idx" ON "auth"."tbl_user_sessions"("jwt_id");

-- CreateIndex
CREATE INDEX "tbl_user_sessions_login_at_idx" ON "auth"."tbl_user_sessions"("login_at");

-- CreateIndex
CREATE INDEX "tbl_user_sessions_is_revoked_idx" ON "auth"."tbl_user_sessions"("is_revoked");

-- CreateIndex
CREATE INDEX "tbl_user_sessions_user_id_is_revoked_idx" ON "auth"."tbl_user_sessions"("user_id", "is_revoked");

-- CreateIndex
CREATE INDEX "tbl_user_sessions_expires_at_idx" ON "auth"."tbl_user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_mfa_tokens_token_key" ON "auth"."tbl_mfa_tokens"("token");

-- CreateIndex
CREATE INDEX "tbl_mfa_tokens_user_id_idx" ON "auth"."tbl_mfa_tokens"("user_id");

-- CreateIndex
CREATE INDEX "tbl_mfa_tokens_token_idx" ON "auth"."tbl_mfa_tokens"("token");

-- CreateIndex
CREATE INDEX "tbl_mfa_tokens_expires_at_idx" ON "auth"."tbl_mfa_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "tbl_mfa_factors_user_id_idx" ON "auth"."tbl_mfa_factors"("user_id");

-- CreateIndex
CREATE INDEX "tbl_mfa_factors_type_idx" ON "auth"."tbl_mfa_factors"("type");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_user_id_idx" ON "log"."tbl_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_table_name_idx" ON "log"."tbl_audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_entity_schema_idx" ON "log"."tbl_audit_logs"("entity_schema");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_entity_table_idx" ON "log"."tbl_audit_logs"("entity_table");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_entity_pk_idx" ON "log"."tbl_audit_logs"("entity_pk");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_action_idx" ON "log"."tbl_audit_logs"("action");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_changed_at_idx" ON "log"."tbl_audit_logs"("changed_at");

-- AddForeignKey
ALTER TABLE "core"."tbl_users" ADD CONSTRAINT "tbl_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tbl_users" ADD CONSTRAINT "tbl_users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tbl_users" ADD CONSTRAINT "tbl_users_user_status_id_fkey" FOREIGN KEY ("user_status_id") REFERENCES "core"."tbl_user_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tbl_user_roles" ADD CONSTRAINT "tbl_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tbl_user_roles" ADD CONSTRAINT "tbl_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."tbl_roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_factories" ADD CONSTRAINT "tbl_factories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_factories" ADD CONSTRAINT "tbl_factories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_teams" ADD CONSTRAINT "tbl_teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_teams" ADD CONSTRAINT "tbl_teams_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_teams" ADD CONSTRAINT "tbl_teams_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "org"."tbl_factories"("factory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_departments" ADD CONSTRAINT "tbl_departments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_departments" ADD CONSTRAINT "tbl_departments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_departments" ADD CONSTRAINT "tbl_departments_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "org"."tbl_factories"("factory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_warehouses" ADD CONSTRAINT "tbl_warehouses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_warehouses" ADD CONSTRAINT "tbl_warehouses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_warehouses" ADD CONSTRAINT "tbl_warehouses_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "org"."tbl_factories"("factory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_setors" ADD CONSTRAINT "tbl_setors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_setors" ADD CONSTRAINT "tbl_setors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_setors" ADD CONSTRAINT "tbl_setors_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "org"."tbl_factories"("factory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_factories" ADD CONSTRAINT "tbl_user_factories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_factories" ADD CONSTRAINT "tbl_user_factories_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "org"."tbl_factories"("factory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_teams" ADD CONSTRAINT "tbl_user_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_teams" ADD CONSTRAINT "tbl_user_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "org"."tbl_teams"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_departments" ADD CONSTRAINT "tbl_user_departments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_departments" ADD CONSTRAINT "tbl_user_departments_dep_id_fkey" FOREIGN KEY ("dep_id") REFERENCES "org"."tbl_departments"("dep_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_warehouses" ADD CONSTRAINT "tbl_user_warehouses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_warehouses" ADD CONSTRAINT "tbl_user_warehouses_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "org"."tbl_warehouses"("warehouse_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_setors" ADD CONSTRAINT "tbl_user_setors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org"."tbl_user_setors" ADD CONSTRAINT "tbl_user_setors_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "org"."tbl_setors"("setor_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tbl_login_attempts" ADD CONSTRAINT "tbl_login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log"."tbl_user_activity_logs" ADD CONSTRAINT "tbl_user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log"."tbl_user_activity_logs" ADD CONSTRAINT "tbl_user_activity_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."tbl_user_sessions"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tbl_password_reset_logs" ADD CONSTRAINT "tbl_password_reset_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log"."tbl_user_password_history" ADD CONSTRAINT "tbl_user_password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tbl_user_sessions" ADD CONSTRAINT "tbl_user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tbl_mfa_tokens" ADD CONSTRAINT "tbl_mfa_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tbl_mfa_factors" ADD CONSTRAINT "tbl_mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log"."tbl_audit_logs" ADD CONSTRAINT "tbl_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
