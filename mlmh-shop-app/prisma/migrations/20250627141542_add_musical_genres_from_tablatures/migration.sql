-- CreateTable
CREATE TABLE "_TablatureMusicalGenre" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TablatureMusicalGenre_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TablatureMusicalGenre_B_index" ON "_TablatureMusicalGenre"("B");

-- AddForeignKey
ALTER TABLE "_TablatureMusicalGenre" ADD CONSTRAINT "_TablatureMusicalGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "MusicalGenre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TablatureMusicalGenre" ADD CONSTRAINT "_TablatureMusicalGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Tablature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
