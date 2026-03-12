-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'GYM_ADMIN', 'TRAINER', 'RECEPTIONIST', 'CLIENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'STRENGTH', 'ENDURANCE');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('FRONT', 'SIDE', 'BACK');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'SINPE_MOVIL', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('CARDIO', 'STRENGTH', 'FREE_WEIGHTS', 'FUNCTIONAL', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'DAMAGED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE', 'REPAIR', 'REPLACEMENT');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('SIGNUP', 'RENEWAL', 'REFERRAL', 'SEASONAL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "gyms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Costa_Rica',
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "body_fat_percentage" DOUBLE PRECISION,
    "measurements" JSONB,
    "goal_type" "GoalType" NOT NULL,
    "target_weight" DOUBLE PRECISION,
    "target_date" TIMESTAMP(3),
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_progress" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION NOT NULL,
    "body_fat_percentage" DOUBLE PRECISION,
    "measurements" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photo_type" "PhotoType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" "MembershipType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL(10,2) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CRC',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_payment_intent_id" TEXT,
    "sinpe_reference" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_goal" "GoalType" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "weekly_schedule" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_assignments" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "routine_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "EquipmentCategory" NOT NULL,
    "purchase_date" TIMESTAMP(3),
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "maintenance_frequency_days" INTEGER NOT NULL,
    "last_maintenance" TIMESTAMP(3),
    "next_maintenance" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(10,2),
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "applicable_membership_types" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gyms_subdomain_key" ON "gyms"("subdomain");

-- CreateIndex
CREATE INDEX "users_gym_id_email_idx" ON "users"("gym_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_gym_id_email_key" ON "users"("gym_id", "email");

-- CreateIndex
CREATE INDEX "clients_gym_id_status_idx" ON "clients"("gym_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_gym_id_email_key" ON "clients"("gym_id", "email");

-- CreateIndex
CREATE INDEX "physical_progress_gym_id_client_id_date_idx" ON "physical_progress"("gym_id", "client_id", "date");

-- CreateIndex
CREATE INDEX "progress_photos_gym_id_client_id_idx" ON "progress_photos"("gym_id", "client_id");

-- CreateIndex
CREATE INDEX "memberships_gym_id_status_end_date_idx" ON "memberships"("gym_id", "status", "end_date");

-- CreateIndex
CREATE INDEX "memberships_gym_id_client_id_idx" ON "memberships"("gym_id", "client_id");

-- CreateIndex
CREATE INDEX "payments_gym_id_client_id_created_at_idx" ON "payments"("gym_id", "client_id", "created_at");

-- CreateIndex
CREATE INDEX "routines_gym_id_idx" ON "routines"("gym_id");

-- CreateIndex
CREATE INDEX "routine_assignments_gym_id_client_id_is_active_idx" ON "routine_assignments"("gym_id", "client_id", "is_active");

-- CreateIndex
CREATE INDEX "equipment_gym_id_status_idx" ON "equipment"("gym_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_records_gym_id_equipment_id_idx" ON "maintenance_records"("gym_id", "equipment_id");

-- CreateIndex
CREATE INDEX "promotions_gym_id_is_active_idx" ON "promotions"("gym_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_gym_id_code_key" ON "promotions"("gym_id", "code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_progress" ADD CONSTRAINT "physical_progress_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_progress" ADD CONSTRAINT "physical_progress_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
