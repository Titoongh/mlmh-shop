/*
  Warnings:

  - You are about to drop the column `email` on the `DownloadIntent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DownloadIntent_email_idx";

-- AlterTable
ALTER TABLE "DownloadIntent" DROP COLUMN "email";
