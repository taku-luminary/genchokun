-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "hasInsurance" BOOLEAN,
ADD COLUMN     "insuranceNote" TEXT,
ADD COLUMN     "isInvoiceRegistered" BOOLEAN,
ADD COLUMN     "manufacturerCertifications" TEXT,
ADD COLUMN     "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "qualificationsOther" TEXT,
ADD COLUMN     "workExperience" TEXT;
