-- CreateTable
CREATE TABLE "DownloadIntent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,

    CONSTRAINT "DownloadIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "downloadIntentId" TEXT NOT NULL,
    "tablatureId" TEXT NOT NULL,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DownloadIntent_stripeSessionId_key" ON "DownloadIntent"("stripeSessionId");

-- CreateIndex
CREATE INDEX "DownloadIntent_stripeSessionId_idx" ON "DownloadIntent"("stripeSessionId");

-- CreateIndex
CREATE INDEX "DownloadIntent_email_idx" ON "DownloadIntent"("email");

-- CreateIndex
CREATE INDEX "Download_downloadIntentId_idx" ON "Download"("downloadIntentId");

-- CreateIndex
CREATE INDEX "Download_tablatureId_idx" ON "Download"("tablatureId");

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_downloadIntentId_fkey" FOREIGN KEY ("downloadIntentId") REFERENCES "DownloadIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_tablatureId_fkey" FOREIGN KEY ("tablatureId") REFERENCES "Tablature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
