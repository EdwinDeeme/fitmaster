-- AlterTable: make membershipId optional in payments
ALTER TABLE "payments" ALTER COLUMN "membership_id" DROP NOT NULL;
