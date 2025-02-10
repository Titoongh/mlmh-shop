-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tablature" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "_ArtistMusicalGenre" ADD CONSTRAINT "_ArtistMusicalGenre_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ArtistMusicalGenre_AB_unique";

-- AlterTable
ALTER TABLE "_ArtistToTablature" ADD CONSTRAINT "_ArtistToTablature_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ArtistToTablature_AB_unique";

-- AlterTable
ALTER TABLE "_TablatureMusicalGenre" ADD CONSTRAINT "_TablatureMusicalGenre_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TablatureMusicalGenre_AB_unique";
