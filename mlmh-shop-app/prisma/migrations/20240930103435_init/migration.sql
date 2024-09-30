-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "country" TEXT NOT NULL,
    "genre" TEXT,
    "musicalGenre" TEXT NOT NULL,
    "picture" TEXT NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tablature" (
    "id" SERIAL NOT NULL,
    "downloadLink" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "musicalGenre" TEXT,
    "youtubeLinks" TEXT NOT NULL,
    "audioLinks" TEXT NOT NULL,

    CONSTRAINT "Tablature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistTablatureMap" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "tablatureId" INTEGER NOT NULL,

    CONSTRAINT "ArtistTablatureMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistTablatureMap_artistId_tablatureId_key" ON "ArtistTablatureMap"("artistId", "tablatureId");

-- AddForeignKey
ALTER TABLE "ArtistTablatureMap" ADD CONSTRAINT "ArtistTablatureMap_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistTablatureMap" ADD CONSTRAINT "ArtistTablatureMap_tablatureId_fkey" FOREIGN KEY ("tablatureId") REFERENCES "Tablature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
