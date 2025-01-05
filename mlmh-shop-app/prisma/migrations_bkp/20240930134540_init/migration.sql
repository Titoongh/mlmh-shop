-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('AUDIO', 'VIDEO', 'IMAGE');

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "genre" TEXT,
    "picture" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tablature" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "downloadLink" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,

    CONSTRAINT "Tablature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ContentType" NOT NULL,
    "url" TEXT,
    "blob" BYTEA,
    "tablatureId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicalGenre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MusicalGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistMusicalGenre" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToTablature" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TablatureMusicalGenre" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_name_key" ON "Artist"("name");

-- CreateIndex
CREATE INDEX "Artist_id_idx" ON "Artist"("id");

-- CreateIndex
CREATE INDEX "Artist_name_idx" ON "Artist"("name");

-- CreateIndex
CREATE INDEX "Tablature_id_idx" ON "Tablature"("id");

-- CreateIndex
CREATE INDEX "Tablature_title_idx" ON "Tablature"("title");

-- CreateIndex
CREATE UNIQUE INDEX "MusicalGenre_name_key" ON "MusicalGenre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistMusicalGenre_AB_unique" ON "_ArtistMusicalGenre"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistMusicalGenre_B_index" ON "_ArtistMusicalGenre"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToTablature_AB_unique" ON "_ArtistToTablature"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToTablature_B_index" ON "_ArtistToTablature"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TablatureMusicalGenre_AB_unique" ON "_TablatureMusicalGenre"("A", "B");

-- CreateIndex
CREATE INDEX "_TablatureMusicalGenre_B_index" ON "_TablatureMusicalGenre"("B");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_tablatureId_fkey" FOREIGN KEY ("tablatureId") REFERENCES "Tablature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistMusicalGenre" ADD CONSTRAINT "_ArtistMusicalGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistMusicalGenre" ADD CONSTRAINT "_ArtistMusicalGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "MusicalGenre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToTablature" ADD CONSTRAINT "_ArtistToTablature_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToTablature" ADD CONSTRAINT "_ArtistToTablature_B_fkey" FOREIGN KEY ("B") REFERENCES "Tablature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TablatureMusicalGenre" ADD CONSTRAINT "_TablatureMusicalGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "MusicalGenre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TablatureMusicalGenre" ADD CONSTRAINT "_TablatureMusicalGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Tablature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
