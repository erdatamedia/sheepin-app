-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('GPS', 'MAP_PICKER', 'MANUAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressDetail" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationSource" "LocationSource",
ADD COLUMN     "locationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "regency" TEXT,
ADD COLUMN     "village" TEXT;
