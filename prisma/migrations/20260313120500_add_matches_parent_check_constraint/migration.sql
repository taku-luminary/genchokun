-- matches テーブルに「親レコードは project または request のどちらか一方のみ」という整合性制約を追加する。
--
-- このアプリでは、マッチは以下のどちらかのケースでのみ発生する。
-- 1. 販売店が投稿した project に対して工事店が応募し、選定された場合
-- 2. 工事店が投稿した request に対して販売店が応募し、即マッチングした場合
--
-- そのため matches レコードはprojectId か requestId のどちらか一方だけを持つ必要がある。
--
-- 以下のような不正な状態を防ぐために CHECK 制約を追加する。
--   ❌ projectId と requestId の両方が NULL
--   ❌ projectId と requestId の両方が存在する
--
-- Prisma schema では「どちらか一方のみ存在する」制約を表現できないため、
-- migration SQL で直接 CHECK 制約を追加している。

ALTER TABLE "matches"
ADD CONSTRAINT matches_exactly_one_parent_chk
CHECK (("projectId" IS NOT NULL) <> ("requestId" IS NOT NULL));