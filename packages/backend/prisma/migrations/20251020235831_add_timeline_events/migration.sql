-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'MCA';

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "timestampUtc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" "RolUsuario" NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "comunidadId" TEXT NOT NULL,
    "barrioId" TEXT,
    "nucleoId" TEXT,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_events_timestampUtc_idx" ON "timeline_events"("timestampUtc");

-- CreateIndex
CREATE INDEX "timeline_events_actorId_idx" ON "timeline_events"("actorId");

-- CreateIndex
CREATE INDEX "timeline_events_actionType_idx" ON "timeline_events"("actionType");

-- CreateIndex
CREATE INDEX "timeline_events_entityType_idx" ON "timeline_events"("entityType");

-- CreateIndex
CREATE INDEX "timeline_events_comunidadId_idx" ON "timeline_events"("comunidadId");

-- CreateIndex
CREATE INDEX "timeline_events_barrioId_idx" ON "timeline_events"("barrioId");

-- CreateIndex
CREATE INDEX "timeline_events_nucleoId_idx" ON "timeline_events"("nucleoId");

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "comunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
