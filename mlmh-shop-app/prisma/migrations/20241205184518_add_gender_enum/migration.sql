/*
  Warnings:

  - The `genre` column on the `Artist` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MAN', 'WOMAN');

-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "genre",
ADD COLUMN     "genre" "Gender";
