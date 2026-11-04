-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pending_login_expiry" TIMESTAMP(3),
ADD COLUMN     "pending_login_token" TEXT,
ADD COLUMN     "recovery_codes" TEXT[],
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_secret" TEXT;
