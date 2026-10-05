-- Verifikasi katalog ternak layak bibit.
-- AlterTable
ALTER TABLE "Sheep" ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT,
ADD COLUMN     "verifiedNote" TEXT;

-- CreateIndex
CREATE INDEX "Sheep_verifiedAt_idx" ON "Sheep"("verifiedAt");

-- AddForeignKey
ALTER TABLE "Sheep" ADD CONSTRAINT "Sheep_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
