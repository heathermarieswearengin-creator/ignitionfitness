-- AlterTable
ALTER TABLE "MemberPackage" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "unlimited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "durationDays" INTEGER,
ADD COLUMN     "unlimited" BOOLEAN NOT NULL DEFAULT false;
