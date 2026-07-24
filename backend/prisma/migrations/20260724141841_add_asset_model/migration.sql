-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER');

-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "hostname" TEXT,
    "ipAddress" TEXT,
    "assetType" "AssetType" NOT NULL DEFAULT 'OTHER',
    "operatingSystem" TEXT,
    "owner" TEXT,
    "department" TEXT,
    "criticality" "Criticality" NOT NULL DEFAULT 'MEDIUM',
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_assets" (
    "incidentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "incident_assets_pkey" PRIMARY KEY ("incidentId","assetId")
);

-- CreateIndex
CREATE INDEX "assets_assetName_idx" ON "assets"("assetName");

-- CreateIndex
CREATE INDEX "assets_assetType_idx" ON "assets"("assetType");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_criticality_idx" ON "assets"("criticality");

-- AddForeignKey
ALTER TABLE "incident_assets" ADD CONSTRAINT "incident_assets_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assets" ADD CONSTRAINT "incident_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
