-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "kodamId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Report_kodamId_reportDate_idx" ON "Report"("kodamId", "reportDate");

-- CreateIndex
CREATE INDEX "Report_status_reportDate_idx" ON "Report"("status", "reportDate");

-- CreateIndex
CREATE INDEX "Resource_kodamId_type_idx" ON "Resource"("kodamId", "type");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_kodamId_fkey" FOREIGN KEY ("kodamId") REFERENCES "Kodam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
