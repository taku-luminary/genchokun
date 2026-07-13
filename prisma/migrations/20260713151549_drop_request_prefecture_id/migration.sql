/*
  Warnings:

  - You are about to drop the column `prefectureId` on the `requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_prefectureId_fkey";

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "prefectureId";
