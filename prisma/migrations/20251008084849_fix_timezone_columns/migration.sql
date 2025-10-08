-- AlterTable
ALTER TABLE "auth"."tbl_login_attempts" ALTER COLUMN "attempt_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "auth"."tbl_mfa_tokens" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "auth"."tbl_password_reset_logs" ALTER COLUMN "request_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "auth"."tbl_user_sessions" ALTER COLUMN "login_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "logout_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "log"."tbl_audit_logs" ALTER COLUMN "changed_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "log"."tbl_user_activity_logs" ALTER COLUMN "action_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "log"."tbl_user_password_history" ALTER COLUMN "changed_at" SET DATA TYPE TIMESTAMPTZ(3);
