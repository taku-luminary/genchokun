/*
  Warnings:

  - You are about to drop the column `reviewAverage` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `companies` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "review_target_role" AS ENUM ('contractor', 'sales');

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "reviewAverage",
DROP COLUMN "reviewCount";

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "matchId" BIGINT NOT NULL,
    "reviewerUserId" UUID NOT NULL,
    "revieweeUserId" UUID NOT NULL,
    "targetRole" "review_target_role" NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "item1Rating" INTEGER NOT NULL,
    "item2Rating" INTEGER NOT NULL,
    "item3Rating" INTEGER NOT NULL,
    "item4Rating" INTEGER NOT NULL,
    "item5Rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_revieweeUserId_targetRole_idx" ON "reviews"("revieweeUserId", "targetRole");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_matchId_reviewerUserId_key" ON "reviews"("matchId", "reviewerUserId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeUserId_fkey" FOREIGN KEY ("revieweeUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
