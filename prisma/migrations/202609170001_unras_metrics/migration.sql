-- Add structured Unras metrics so map annotations never infer numbers from
-- the organization name stored in OperationalRecord.detail.
ALTER TABLE "OperationalRecord"
ADD COLUMN "crowdEstimate" INTEGER,
ADD COLUMN "personnel" INTEGER;
