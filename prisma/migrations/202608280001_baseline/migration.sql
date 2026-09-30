-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ADMINISTRATOR', 'OPERATOR_PUSDALOPS', 'OPERATOR_KODAM', 'ANALYST', 'PIMPINAN');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('KONDUSIF', 'WASPADA', 'SIAGA');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "externalIdentityId" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR_KODAM',
    "kodamId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kodam" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "OperationalStatus" NOT NULL DEFAULT 'KONDUSIF',
    "personnel" INTEGER NOT NULL DEFAULT 0,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "deployed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kodam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalRecord" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "secondary" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "kodamId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT NOT NULL,
    "status" "OperationalStatus" NOT NULL DEFAULT 'KONDUSIF',
    "personnel" INTEGER NOT NULL DEFAULT 0,
    "crowdEstimate" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentReference" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "nextcloudFileId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "path" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "level" "AlertLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "kodam" TEXT NOT NULL DEFAULT 'Nasional',
    "metric" TEXT NOT NULL DEFAULT '-',
    "status" "OperationalStatus" NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "kodamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deployed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BangsitArchive" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "kodamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "nextcloudFileId" TEXT,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BangsitArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapAnnotationLayout" (
    "id" TEXT NOT NULL,
    "annotationId" TEXT NOT NULL,
    "offsetX" INTEGER NOT NULL,
    "offsetY" INTEGER NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapAnnotationLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapPoint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kodam" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "OperationalStatus" NOT NULL DEFAULT 'WASPADA',
    "personnel" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_externalIdentityId_key" ON "User"("externalIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Kodam_code_key" ON "Kodam"("code");

-- CreateIndex
CREATE INDEX "Kodam_slug_idx" ON "Kodam"("slug");

-- CreateIndex
CREATE INDEX "OperationalRecord_module_sortOrder_idx" ON "OperationalRecord"("module", "sortOrder");

-- CreateIndex
CREATE INDEX "OperationalRecord_module_updatedAt_idx" ON "OperationalRecord"("module", "updatedAt");

-- CreateIndex
CREATE INDEX "Incident_kodamId_incidentDate_idx" ON "Incident"("kodamId", "incidentDate");

-- CreateIndex
CREATE INDEX "Incident_category_status_idx" ON "Incident"("category", "status");

-- CreateIndex
CREATE INDEX "DocumentReference_incidentId_createdAt_idx" ON "DocumentReference"("incidentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentReference_incidentId_path_key" ON "DocumentReference"("incidentId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "BangsitArchive_reportId_key" ON "BangsitArchive"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "BangsitArchive_path_key" ON "BangsitArchive"("path");

-- CreateIndex
CREATE INDEX "BangsitArchive_kodamId_createdAt_idx" ON "BangsitArchive"("kodamId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MapAnnotationLayout_annotationId_key" ON "MapAnnotationLayout"("annotationId");

-- CreateIndex
CREATE INDEX "MapAnnotationLayout_updatedAt_idx" ON "MapAnnotationLayout"("updatedAt");

-- CreateIndex
CREATE INDEX "MapPoint_createdAt_idx" ON "MapPoint"("createdAt");

-- CreateIndex
CREATE INDEX "MapPoint_status_idx" ON "MapPoint"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kodamId_fkey" FOREIGN KEY ("kodamId") REFERENCES "Kodam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_kodamId_fkey" FOREIGN KEY ("kodamId") REFERENCES "Kodam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReference" ADD CONSTRAINT "DocumentReference_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_kodamId_fkey" FOREIGN KEY ("kodamId") REFERENCES "Kodam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BangsitArchive" ADD CONSTRAINT "BangsitArchive_kodamId_fkey" FOREIGN KEY ("kodamId") REFERENCES "Kodam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
