-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "smtpProfileId" TEXT;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmtpProfile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "defaultFromEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SmtpProfile_clientId_idx" ON "SmtpProfile"("clientId");

-- CreateIndex
CREATE INDEX "Campaign_smtpProfileId_idx" ON "Campaign"("smtpProfileId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_smtpProfileId_fkey" FOREIGN KEY ("smtpProfileId") REFERENCES "SmtpProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmtpProfile" ADD CONSTRAINT "SmtpProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
