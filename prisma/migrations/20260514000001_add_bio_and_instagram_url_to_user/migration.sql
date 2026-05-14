-- 1. Fix UserRole enum (DB has USER,ADMIN,MANAGER,PROFESSIONAL / schema expects PLATFORM_ADMIN,OWNER,MANAGER,PROFESSIONAL)
-- Create temp text column
ALTER TABLE "User" ADD COLUMN "role_new" TEXT;

-- Copy data with value mapping
UPDATE "User" SET "role_new" = CASE
    WHEN "role"::text = 'ADMIN' THEN 'OWNER'
    WHEN "role"::text = 'USER' THEN 'PROFESSIONAL'
    ELSE "role"::text
END;

-- Drop original role column
ALTER TABLE "User" DROP COLUMN "role";

-- Rename temp column to role
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Drop old enum type (no longer referenced by any column)
DROP TYPE "UserRole";

-- Create new enum with correct values
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'OWNER', 'MANAGER', 'PROFESSIONAL');

-- Convert column to new enum type
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");

-- Set default and NOT NULL
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PROFESSIONAL';
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;

-- 2. Add missing columns (exist in schema.prisma but not in DB)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Drop obsolete columns (exist in DB but NOT in schema.prisma)
ALTER TABLE "User" DROP COLUMN IF EXISTS "businessName";
ALTER TABLE "User" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "User" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "User" DROP COLUMN IF EXISTS "whatsappStatus";
ALTER TABLE "User" DROP COLUMN IF EXISTS "pixCity";
ALTER TABLE "User" DROP COLUMN IF EXISTS "pixKey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "pixKeyType";
ALTER TABLE "User" DROP COLUMN IF EXISTS "pixName";

-- 4. Drop obsolete enum type (only referenced by User.plan which was dropped above)
DROP TYPE IF EXISTS "UserPlan";
