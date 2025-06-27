/*
  Warnings:

  - You are about to drop the `_TablatureMusicalGenre` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TablatureMusicalGenre" DROP CONSTRAINT "_TablatureMusicalGenre_A_fkey";

-- DropForeignKey
ALTER TABLE "_TablatureMusicalGenre" DROP CONSTRAINT "_TablatureMusicalGenre_B_fkey";

-- DropTable
DROP TABLE "_TablatureMusicalGenre";
