/*
  Warnings:

  - You are about to drop the column `rules` on the `Segment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER');

-- AlterTable
ALTER TABLE "Audience" ADD COLUMN     "acelleListUid" TEXT,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "acelleCampaignUid" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "acelleSubscriberId" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "street" TEXT;

-- AlterTable
ALTER TABLE "Segment" DROP COLUMN "rules",
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecommended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitationSentAt" TIMESTAMP(3),
ADD COLUMN     "joinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SegmentContact" (
    "segmentId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentContact_pkey" PRIMARY KEY ("segmentId","contactId")
);

-- CreateIndex
CREATE INDEX "Contact_country_idx" ON "Contact"("country");

-- CreateIndex
CREATE INDEX "Contact_gender_idx" ON "Contact"("gender");

-- CreateIndex
CREATE INDEX "Contact_maritalStatus_idx" ON "Contact"("maritalStatus");

-- AddForeignKey
ALTER TABLE "Audience" ADD CONSTRAINT "Audience_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentContact" ADD CONSTRAINT "SegmentContact_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentContact" ADD CONSTRAINT "SegmentContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
