-- CreateTable
CREATE TABLE "auth"."tbl_refresh_tokens" (
    "token_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "session_id" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tbl_refresh_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_refresh_tokens_token_hash_key" ON "auth"."tbl_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "tbl_refresh_tokens_user_id_idx" ON "auth"."tbl_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "tbl_refresh_tokens_token_hash_idx" ON "auth"."tbl_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "tbl_refresh_tokens_expires_at_idx" ON "auth"."tbl_refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "tbl_refresh_tokens_is_revoked_idx" ON "auth"."tbl_refresh_tokens"("is_revoked");

-- CreateIndex
CREATE INDEX "tbl_refresh_tokens_user_id_is_revoked_idx" ON "auth"."tbl_refresh_tokens"("user_id", "is_revoked");

-- CreateIndex
CREATE INDEX "tbl_refresh_tokens_session_id_idx" ON "auth"."tbl_refresh_tokens"("session_id");

-- AddForeignKey
ALTER TABLE "auth"."tbl_refresh_tokens" ADD CONSTRAINT "tbl_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."tbl_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
