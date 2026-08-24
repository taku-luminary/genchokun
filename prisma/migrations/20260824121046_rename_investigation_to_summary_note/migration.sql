-- RenameColumn
-- projects / requests の investigationSummary・investigationDetails を summary・note に改名する。
-- RENAME COLUMN のため既存データは保持される（DROP/ADD ではないためデータ消失なし）。
ALTER TABLE "projects" RENAME COLUMN "investigationSummary" TO "summary";
ALTER TABLE "projects" RENAME COLUMN "investigationDetails" TO "note";
ALTER TABLE "requests" RENAME COLUMN "investigationSummary" TO "summary";
ALTER TABLE "requests" RENAME COLUMN "investigationDetails" TO "note";
