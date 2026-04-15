-- AlterTable
ALTER TABLE "Sheep" ADD COLUMN     "ownerUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Sheep" ADD CONSTRAINT "Sheep_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
