-- CreateEnum
CREATE TYPE "PROJECT_TYPE" AS ENUM ('SYSTEM', 'DOCU', 'BOTH');

-- AlterTable: new Client columns
ALTER TABLE "Client" ADD COLUMN     "course" TEXT,
ADD COLUMN     "docuDueDate" TIMESTAMP(3),
ADD COLUMN     "docuPrice" INTEGER,
ADD COLUMN     "projectType" "PROJECT_TYPE" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "school" TEXT,
ADD COLUMN     "systemDueDate" TIMESTAMP(3),
ADD COLUMN     "systemPrice" INTEGER,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '';

-- Backfill: the old `name` column holds the project title, so move it to `title`
-- and free `name` up for the person's name (filled in later, hence nullable).
UPDATE "Client" SET "title" = "name";
ALTER TABLE "Client" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "Client" ALTER COLUMN "name" DROP NOT NULL;
UPDATE "Client" SET "name" = NULL;

-- Backfill: the single `dueDate` can't be attributed to system vs docu after the
-- fact, so keep it on both and mark existing rows BOTH rather than lose the date.
UPDATE "Client" SET "systemDueDate" = "dueDate", "docuDueDate" = "dueDate" WHERE "dueDate" IS NOT NULL;
UPDATE "Client" SET "projectType" = 'BOTH';

-- AlterTable: `dueDate` is now split across systemDueDate/docuDueDate
ALTER TABLE "Client" DROP COLUMN "dueDate";

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "method" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Agreement',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE INDEX "ClientDocument_clientId_idx" ON "ClientDocument"("clientId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
