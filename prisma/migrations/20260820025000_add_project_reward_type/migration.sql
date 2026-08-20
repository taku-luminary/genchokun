-- CreateEnum
CREATE TYPE "reward_type" AS ENUM ('fixed', 'negotiable');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "rewardType" "reward_type" NOT NULL DEFAULT 'fixed';
