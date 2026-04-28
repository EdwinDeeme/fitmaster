-- AlterEnum
ALTER TYPE "MembershipType" ADD VALUE 'COMBINED';

-- AlterTable
ALTER TABLE "membership_plans" ADD COLUMN "prices" JSONB;
