-- Make clientId optional in Payment and add direct client relation
ALTER TABLE "payments" ALTER COLUMN "client_id" DROP NOT NULL;
