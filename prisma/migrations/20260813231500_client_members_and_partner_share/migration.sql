-- CreateTable
CREATE TABLE "ClientMember" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientMember_clientId_idx" ON "ClientMember"("clientId");

-- AddForeignKey
ALTER TABLE "ClientMember" ADD CONSTRAINT "ClientMember_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: who referred the client, and their cut of the system price
ALTER TABLE "Client" ADD COLUMN     "partnerName" TEXT,
ADD COLUMN     "partnerSharePercent" INTEGER NOT NULL DEFAULT 0;

-- Backfill: a client whose single `name` was filled in becomes that group's
-- first member, so nothing is lost when the column goes.
INSERT INTO "ClientMember" ("clientId", "name", "position", "updatedAt")
SELECT "id", btrim("name"), 0, CURRENT_TIMESTAMP
FROM "Client"
WHERE "name" IS NOT NULL AND btrim("name") <> '';

-- AlterTable: one name is replaced by the ClientMember list
ALTER TABLE "Client" DROP COLUMN "name";
