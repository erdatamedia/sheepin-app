-- Kode ternak unik per pemilik, bukan di seluruh sistem.
-- Aman dijalankan pada data yang ada: semua kode yang sebelumnya unik global otomatis unik per pemilik.
-- (Ternak tanpa pemilik, ownerUserId NULL, diperiksa di lapisan aplikasi karena NULL tidak dianggap sama oleh indeks unik.)

-- DropIndex
DROP INDEX "Sheep_sheepCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Sheep_ownerUserId_sheepCode_key" ON "Sheep"("ownerUserId", "sheepCode");
