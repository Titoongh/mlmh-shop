-- AlterTable
ALTER TABLE "Tablature" ALTER COLUMN "downloadLink" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TablatureFile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filename" TEXT NOT NULL,
    "scalewayKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "tablatureId" TEXT NOT NULL,

    CONSTRAINT "TablatureFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TablatureFile_tablatureId_idx" ON "TablatureFile"("tablatureId");

-- CreateIndex
CREATE INDEX "TablatureFile_scalewayKey_idx" ON "TablatureFile"("scalewayKey");

-- AddForeignKey
ALTER TABLE "TablatureFile" ADD CONSTRAINT "TablatureFile_tablatureId_fkey" FOREIGN KEY ("tablatureId") REFERENCES "Tablature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
