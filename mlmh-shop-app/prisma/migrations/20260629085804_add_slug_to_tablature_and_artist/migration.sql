-- AlterTable
ALTER TABLE "Artist" ADD COLUMN "slug" TEXT;

-- AlterTable
ALTER TABLE "Tablature" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tablature_slug_key" ON "Tablature"("slug");
