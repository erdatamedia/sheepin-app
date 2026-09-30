-- Login peternak dengan no. HP + PIN.
-- Jalankan skrip `pnpm phones:normalize --apply` SEBELUM migrasi ini di database yang sudah berisi data,
-- karena indeks unik pada "phone" gagal bila ada nomor ganda.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "mustChangePin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinChangedAt" TIMESTAMP(3),
ADD COLUMN     "pinHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
