-- AlterTable
ALTER TABLE "DownloadIntent" ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "DownloadIntent_status_idx" ON "DownloadIntent"("status");
