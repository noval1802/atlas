-- Backfill only known baseline rows. User-created records remain empty until an
-- operator supplies verified operational figures through the Unras form.
UPDATE "OperationalRecord"
SET "crowdEstimate" = CASE id
    WHEN 'MON-UNRAS-01' THEN 1200
    WHEN 'MON-UNRAS-02' THEN 840
    WHEN 'MON-UNRAS-03' THEN 1000
    WHEN 'MON-UNRAS-04' THEN 800
  END,
  personnel = CASE id
    WHEN 'MON-UNRAS-01' THEN 360
    WHEN 'MON-UNRAS-02' THEN 240
    WHEN 'MON-UNRAS-03' THEN 300
    WHEN 'MON-UNRAS-04' THEN 220
  END
WHERE id IN ('MON-UNRAS-01', 'MON-UNRAS-02', 'MON-UNRAS-03', 'MON-UNRAS-04');
