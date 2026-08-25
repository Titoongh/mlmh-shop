-- CreateEnum
CREATE TYPE "MethodFileRole" AS ENUM ('DOCUMENT', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "MethodOfferKind" AS ENUM ('FULL', 'DOCUMENTS', 'LESSON');

-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_tablatureId_fkey";

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "methodId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "methodOfferId" TEXT,
ALTER COLUMN "tablatureId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Method" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "publicationDate" TIMESTAMP(3),

    CONSTRAINT "Method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodLesson" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "methodId" TEXT NOT NULL,

    CONSTRAINT "MethodLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodFile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filename" TEXT NOT NULL,
    "scalewayKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "role" "MethodFileRole" NOT NULL,
    "methodId" TEXT NOT NULL,
    "lessonId" TEXT,

    CONSTRAINT "MethodFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodOffer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kind" "MethodOfferKind" NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "methodId" TEXT NOT NULL,
    "lessonId" TEXT,

    CONSTRAINT "MethodOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistMethod" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistMethod_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MethodMusicalGenre" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MethodMusicalGenre_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Method_slug_key" ON "Method"("slug");

-- CreateIndex
CREATE INDEX "Method_id_idx" ON "Method"("id");

-- CreateIndex
CREATE INDEX "Method_title_idx" ON "Method"("title");

-- CreateIndex
CREATE INDEX "MethodLesson_methodId_idx" ON "MethodLesson"("methodId");

-- CreateIndex
CREATE INDEX "MethodFile_methodId_idx" ON "MethodFile"("methodId");

-- CreateIndex
CREATE INDEX "MethodFile_lessonId_idx" ON "MethodFile"("lessonId");

-- CreateIndex
CREATE INDEX "MethodFile_scalewayKey_idx" ON "MethodFile"("scalewayKey");

-- CreateIndex
CREATE INDEX "MethodOffer_methodId_idx" ON "MethodOffer"("methodId");

-- CreateIndex
CREATE INDEX "MethodOffer_lessonId_idx" ON "MethodOffer"("lessonId");

-- CreateIndex
CREATE INDEX "_ArtistMethod_B_index" ON "_ArtistMethod"("B");

-- CreateIndex
CREATE INDEX "_MethodMusicalGenre_B_index" ON "_MethodMusicalGenre"("B");

-- CreateIndex
CREATE INDEX "PurchaseItem_methodOfferId_idx" ON "PurchaseItem"("methodOfferId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "Method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodLesson" ADD CONSTRAINT "MethodLesson_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "Method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodFile" ADD CONSTRAINT "MethodFile_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "Method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodFile" ADD CONSTRAINT "MethodFile_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "MethodLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodOffer" ADD CONSTRAINT "MethodOffer_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "Method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodOffer" ADD CONSTRAINT "MethodOffer_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "MethodLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_tablatureId_fkey" FOREIGN KEY ("tablatureId") REFERENCES "Tablature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_methodOfferId_fkey" FOREIGN KEY ("methodOfferId") REFERENCES "MethodOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistMethod" ADD CONSTRAINT "_ArtistMethod_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistMethod" ADD CONSTRAINT "_ArtistMethod_B_fkey" FOREIGN KEY ("B") REFERENCES "Method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MethodMusicalGenre" ADD CONSTRAINT "_MethodMusicalGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "Method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MethodMusicalGenre" ADD CONSTRAINT "_MethodMusicalGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "MusicalGenre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
