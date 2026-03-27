-- AlterTable
ALTER TABLE "memberships" ADD COLUMN "membership_plan_id" TEXT;

-- CreateIndex
CREATE INDEX "memberships_gym_id_membership_plan_id_idx" ON "memberships"("gym_id", "membership_plan_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_plan_id_fkey" 
  FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
