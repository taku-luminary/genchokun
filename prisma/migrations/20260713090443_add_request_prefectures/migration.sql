-- CreateTable
CREATE TABLE "_RequestPrefectures" (
    "A" INTEGER NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_RequestPrefectures_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RequestPrefectures_B_index" ON "_RequestPrefectures"("B");

-- AddForeignKey
ALTER TABLE "_RequestPrefectures" ADD CONSTRAINT "_RequestPrefectures_A_fkey" FOREIGN KEY ("A") REFERENCES "prefectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestPrefectures" ADD CONSTRAINT "_RequestPrefectures_B_fkey" FOREIGN KEY ("B") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ▼ 既存データのバックフィル（既存の単一 prefectureId を複数側にコピー）
-- A = prefectures.id, B = requests.id（Prismaがアルファベット順で命名）
-- ON CONFLICT DO NOTHING により何度実行しても安全（冪等）
INSERT INTO "_RequestPrefectures" ("A", "B")
SELECT "prefectureId", "id" FROM "requests"
ON CONFLICT DO NOTHING;