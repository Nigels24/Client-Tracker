-- The partner-share feature is removed: this app is used by both parties, so a
-- dashboard that silently nets out one side's 25% cut was misleading. No client
-- ever had a partner set, so no data is lost here.

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "partnerName",
DROP COLUMN "partnerSharePercent";
