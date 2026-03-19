-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');

-- CreateEnum
CREATE TYPE "subscription_interval" AS ENUM ('none', 'month', 'year');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('open', 'completed');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('open', 'completed');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('pending', 'active', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "article_status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "interview_section_key" AS ENUM ('company_intro', 'work_style');

-- CreateEnum
CREATE TYPE "interview_block_type" AS ENUM ('section_title', 'catch_copy', 'heading', 'text', 'image');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "isAdmin" BOOLEAN NOT NULL,
    "stripeCustomerId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "planId" BIGINT NOT NULL,
    "status" "subscription_status" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL,
    "stripeSubscriptionId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscription_histories" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "planId" BIGINT,
    "status" "subscription_status" NOT NULL,
    "stripeSubscriptionId" TEXT,
    "eventType" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "rawPayload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscription_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceYen" INTEGER NOT NULL,
    "interval" "subscription_interval" NOT NULL,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "postLimitPerMonth" INTEGER,
    "canUseProfile" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" BIGSERIAL NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL,
    "processedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "prefectureId" INTEGER NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "representativeName" TEXT,
    "employeeCount" INTEGER,
    "websiteUrl" TEXT,
    "description" TEXT,
    "logoImageUrl" TEXT,
    "reviewAverage" DECIMAL(5,2),
    "reviewCount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" BIGSERIAL NOT NULL,
    "prefectureId" INTEGER NOT NULL,
    "city" TEXT,
    "title" TEXT NOT NULL,
    "investigationSummary" TEXT,
    "investigationDetails" TEXT,
    "workStartDate" DATE,
    "workEndDate" DATE,
    "rewardYen" INTEGER,
    "paymentCycle" TEXT,
    "salesUserId" UUID NOT NULL,
    "status" "project_status" NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" BIGSERIAL NOT NULL,
    "prefectureId" INTEGER NOT NULL,
    "city" TEXT,
    "title" TEXT NOT NULL,
    "investigationSummary" TEXT,
    "investigationDetails" TEXT,
    "availableStartDate" DATE,
    "availableEndDate" DATE,
    "rewardMinYen" INTEGER,
    "paymentCycle" TEXT,
    "contractorUserId" UUID NOT NULL,
    "status" "request_status" NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prefectures" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "prefectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_details" (
    "id" BIGSERIAL NOT NULL,
    "matchId" BIGINT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT,
    "requestId" BIGINT,
    "salesUserId" UUID NOT NULL,
    "contractorUserId" UUID NOT NULL,
    "status" "match_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_interview_articles" (
    "id" BIGSERIAL NOT NULL,
    "companyId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "introText" TEXT,
    "status" "article_status" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_interview_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_interview_blocks" (
    "id" BIGSERIAL NOT NULL,
    "articleId" BIGINT NOT NULL,
    "sectionKey" "interview_section_key" NOT NULL,
    "blockType" "interview_block_type" NOT NULL,
    "textContent" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_interview_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_stripeSubscriptionId_key" ON "user_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscription_histories_userId_created_at_idx" ON "user_subscription_histories"("userId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_events_stripeEventId_key" ON "stripe_webhook_events"("stripeEventId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_userId_key" ON "companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "application_details_matchId_key" ON "application_details"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_requestId_key" ON "matches"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "company_interview_articles_companyId_key" ON "company_interview_articles"("companyId");

-- CreateIndex
CREATE INDEX "company_interview_blocks_articleId_sectionKey_displayOrder_idx" ON "company_interview_blocks"("articleId", "sectionKey", "displayOrder");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription_histories" ADD CONSTRAINT "user_subscription_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription_histories" ADD CONSTRAINT "user_subscription_histories_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_prefectureId_fkey" FOREIGN KEY ("prefectureId") REFERENCES "prefectures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_prefectureId_fkey" FOREIGN KEY ("prefectureId") REFERENCES "prefectures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_salesUserId_fkey" FOREIGN KEY ("salesUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_prefectureId_fkey" FOREIGN KEY ("prefectureId") REFERENCES "prefectures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_contractorUserId_fkey" FOREIGN KEY ("contractorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_details" ADD CONSTRAINT "application_details_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_salesUserId_fkey" FOREIGN KEY ("salesUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_contractorUserId_fkey" FOREIGN KEY ("contractorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_interview_articles" ADD CONSTRAINT "company_interview_articles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_interview_articles" ADD CONSTRAINT "company_interview_articles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_interview_articles" ADD CONSTRAINT "company_interview_articles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_interview_blocks" ADD CONSTRAINT "company_interview_blocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "company_interview_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
