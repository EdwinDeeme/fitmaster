-- Add created_by_user_id column to clients table
ALTER TABLE "clients" ADD COLUMN "created_by_user_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "clients_gym_id_created_by_user_id_idx" ON "clients"("gym_id", "created_by_user_id");
