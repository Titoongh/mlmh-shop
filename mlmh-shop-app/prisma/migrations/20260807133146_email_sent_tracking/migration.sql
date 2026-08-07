-- AlterTable
ALTER TABLE "DownloadIntent" ADD COLUMN     "emailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "emailSentAt" TIMESTAMP(3);
