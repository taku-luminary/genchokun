-- 施工IDとメーカー認定は発注側から区別がつかないため、この項目は施工ID保有メーカーだけを扱う。
-- Prisma の自動生成ではカラムの削除＋追加になり保存済みの値が消えるので、名前の変更だけを手で書く
ALTER TABLE "companies" RENAME COLUMN "manufacturerCertifications" TO "installerIdManufacturers";
