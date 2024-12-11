/*
  Warnings:

  - You are about to drop the column `firstName` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Artist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "lastName";

-- DropEnum
DROP TYPE "Gender";
