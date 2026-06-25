-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'teacher');

-- CreateTable
CREATE TABLE "users" (
    "telegram_id" BIGINT NOT NULL,
    "username" VARCHAR(255),
    "first_name" VARCHAR(255),
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("telegram_id")
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "username" VARCHAR(255),
    "first_name" VARCHAR(255),
    "reason" VARCHAR(100) NOT NULL,
    "operator_id" BIGINT NOT NULL,
    "operator_username" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" BIGSERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blacklist_telegram_id_idx" ON "blacklist"("telegram_id");

-- CreateIndex
CREATE INDEX "blacklist_operator_id_idx" ON "blacklist"("operator_id");

-- CreateIndex（手写追加：部分唯一索引）
-- 同一老师对同一用户仅一条「有效」记录；软删除行 (deleted_at 非空) 不占名额，删除后可重新录入。
-- Prisma schema 无法声明部分唯一索引，故在此手写维护。
CREATE UNIQUE INDEX "blacklist_operator_target_active_uniq"
    ON "blacklist"("operator_id", "telegram_id")
    WHERE "deleted_at" IS NULL;
