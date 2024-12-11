/*
  Warnings:

  - You are about to drop the column `genre` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `Artist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "genre",
DROP COLUMN "picture",
ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "artistId" TEXT;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
