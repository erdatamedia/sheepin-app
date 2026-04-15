-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "SheepGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SheepStatus" AS ENUM ('ACTIVE', 'SOLD', 'DEAD', 'CULLED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'SICK', 'RECOVERING');

-- CreateEnum
CREATE TYPE "ReproductionStatus" AS ENUM ('OPEN', 'MATED', 'PREGNANT', 'LAMBED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sheep" (
    "id" TEXT NOT NULL,
    "sheepCode" TEXT NOT NULL,
    "name" TEXT,
    "breed" TEXT NOT NULL,
    "gender" "SheepGender" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "color" TEXT,
    "physicalMark" TEXT,
    "sireId" TEXT,
    "damId" TEXT,
    "location" TEXT,
    "status" "SheepStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sheep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheepWeight" (
    "id" TEXT NOT NULL,
    "sheepId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheepWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheepBCS" (
    "id" TEXT NOT NULL,
    "sheepId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "bcsScore" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheepBCS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheepHealth" (
    "id" TEXT NOT NULL,
    "sheepId" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "diseaseName" TEXT,
    "treatment" TEXT,
    "medicine" TEXT,
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheepHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheepReproduction" (
    "id" TEXT NOT NULL,
    "sheepId" TEXT NOT NULL,
    "matingDate" TIMESTAMP(3),
    "estimatedBirthDate" TIMESTAMP(3),
    "lambingDate" TIMESTAMP(3),
    "maleParent" TEXT,
    "totalLambBorn" INTEGER,
    "totalLambWeaned" INTEGER,
    "totalBirthWeight" DOUBLE PRECISION,
    "totalWeaningWeight" DOUBLE PRECISION,
    "status" "ReproductionStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheepReproduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sheepId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sheep_sheepCode_key" ON "Sheep"("sheepCode");

-- AddForeignKey
ALTER TABLE "Sheep" ADD CONSTRAINT "Sheep_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepWeight" ADD CONSTRAINT "SheepWeight_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepWeight" ADD CONSTRAINT "SheepWeight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepBCS" ADD CONSTRAINT "SheepBCS_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepBCS" ADD CONSTRAINT "SheepBCS_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepHealth" ADD CONSTRAINT "SheepHealth_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepHealth" ADD CONSTRAINT "SheepHealth_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepReproduction" ADD CONSTRAINT "SheepReproduction_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheepReproduction" ADD CONSTRAINT "SheepReproduction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
