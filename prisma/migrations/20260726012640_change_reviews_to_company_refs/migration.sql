/*
  Warnings:

  - You are about to drop the column `revieweeUserId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerUserId` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchId,reviewerCompanyId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `revieweeCompanyId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewerCompanyId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_revieweeUserId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewerUserId_fkey";

-- DropIndex
DROP INDEX "reviews_matchId_reviewerUserId_key";

-- DropIndex
DROP INDEX "reviews_revieweeUserId_targetRole_idx";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "revieweeUserId",
DROP COLUMN "reviewerUserId",
ADD COLUMN     "revieweeCompanyId" BIGINT NOT NULL,
ADD COLUMN     "reviewerCompanyId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "reviews_revieweeCompanyId_targetRole_idx" ON "reviews"("revieweeCompanyId", "targetRole");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_matchId_reviewerCompanyId_key" ON "reviews"("matchId", "reviewerCompanyId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerCompanyId_fkey" FOREIGN KEY ("reviewerCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeCompanyId_fkey" FOREIGN KEY ("revieweeCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
