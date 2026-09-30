-- CreateEnum
CREATE TYPE "SheepPhotoAngle" AS ENUM ('FACE', 'SIDE', 'REAR', 'EARS_HORNS', 'TAIL');

-- AlterTable
ALTER TABLE "Sheep" ADD COLUMN     "earsHorns" TEXT,
ADD COLUMN     "faceNose" TEXT,
ADD COLUMN     "tailBody" TEXT;

-- CreateTable
CREATE TABLE "SheepPhoto" (
    "id" TEXT NOT NULL,
    "sheepId" TEXT NOT NULL,
    "angle" "SheepPhotoAngle" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheepPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SheepPhoto_sheepId_angle_key" ON "SheepPhoto"("sheepId", "angle");

-- AddForeignKey
ALTER TABLE "SheepPhoto" ADD CONSTRAINT "SheepPhoto_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

