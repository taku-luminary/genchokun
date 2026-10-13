-- CreateTable
CREATE TABLE "terms_agreements" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "agreed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terms_agreements_userId_termsVersion_key" ON "terms_agreements"("userId", "termsVersion");

-- AddForeignKey
ALTER TABLE "terms_agreements" ADD CONSTRAINT "terms_agreements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
