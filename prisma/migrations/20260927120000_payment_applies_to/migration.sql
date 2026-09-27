-- Payments can now say which half of a job they pay for, so a BOTH client can
-- show a separate remaining balance for the System and the Docu. The column is
-- nullable: a payment nobody has assigned yet stays "Unassigned".

-- CreateEnum
CREATE TYPE "PAYMENT_FOR" AS ENUM ('SYSTEM', 'DOCU');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "appliesTo" "PAYMENT_FOR";

-- Backfill: single-type clients can only be paying for their one half.
UPDATE "Payment" p
SET "appliesTo" = c."projectType"::text::"PAYMENT_FOR"
FROM "Client" c
WHERE p."clientId" = c."id"
  AND c."projectType" IN ('SYSTEM', 'DOCU');

-- Backfill: otherwise only trust labels that name exactly one half.
UPDATE "Payment"
SET "appliesTo" = 'SYSTEM'
WHERE "appliesTo" IS NULL
  AND "label" ILIKE '%system%'
  AND "label" NOT ILIKE '%docu%';

UPDATE "Payment"
SET "appliesTo" = 'DOCU'
WHERE "appliesTo" IS NULL
  AND "label" ILIKE '%docu%'
  AND "label" NOT ILIKE '%system%';
