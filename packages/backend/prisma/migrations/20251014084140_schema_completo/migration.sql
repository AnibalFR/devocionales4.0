/*
  Warnings:

  - You are about to drop the column `fecha` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `visitas` table. All the data in the column will be lost.
  - Added the required column `visitDate` to the `visitas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitStatus` to the `visitas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitTime` to the `visitas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitType` to the `visitas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "miembros" DROP CONSTRAINT "miembros_familiaId_fkey";

-- DropIndex
DROP INDEX "visitas_fecha_idx";

-- AlterTable
ALTER TABLE "familias" ADD COLUMN     "estatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "miembroCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "miembros" ADD COLUMN     "barrioId" TEXT,
ADD COLUMN     "devocionalDia" TEXT,
ADD COLUMN     "devocionalHora" TEXT,
ADD COLUMN     "devocionalMiembros" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "devocionalParticipantes" INTEGER,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "edadAproximada" INTEGER,
ADD COLUMN     "fechaActualizacionEdad" TIMESTAMP(3),
ADD COLUMN     "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nucleoId" TEXT,
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'MIEMBRO',
ADD COLUMN     "rolFamiliar" TEXT,
ADD COLUMN     "tieneDevocional" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "familiaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "visitas" DROP COLUMN "fecha",
DROP COLUMN "tipo",
ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "barrioId" TEXT,
ADD COLUMN     "barrioOtro" TEXT,
ADD COLUMN     "materialDejado" JSON,
ADD COLUMN     "motivoNoVisita" TEXT,
ADD COLUMN     "motivoNoVisitaOtra" TEXT,
ADD COLUMN     "nucleoId" TEXT,
ADD COLUMN     "seguimientoActividadBasica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seguimientoActividadBasicaEspecificar" TEXT,
ADD COLUMN     "seguimientoFecha" TEXT,
ADD COLUMN     "seguimientoHora" TEXT,
ADD COLUMN     "seguimientoNinguno" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seguimientoVisita" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoSeguimiento" TEXT,
ADD COLUMN     "visitActivities" JSON,
ADD COLUMN     "visitDate" TEXT NOT NULL,
ADD COLUMN     "visitStatus" TEXT NOT NULL,
ADD COLUMN     "visitTime" TEXT NOT NULL,
ADD COLUMN     "visitType" TEXT NOT NULL,
ADD COLUMN     "visitorUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "TipoVisita";

-- CreateTable
CREATE TABLE "metas" (
    "id" TEXT NOT NULL,
    "comunidadId" TEXT NOT NULL,
    "trimestre" TEXT NOT NULL,
    "fechaInicio" TEXT NOT NULL,
    "fechaFin" TEXT NOT NULL,
    "metaNucleos" INTEGER NOT NULL DEFAULT 0,
    "metaVisitas" INTEGER NOT NULL DEFAULT 0,
    "metaPersonasVisitando" INTEGER NOT NULL DEFAULT 0,
    "metaDevocionales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metas_comunidadId_idx" ON "metas"("comunidadId");

-- CreateIndex
CREATE INDEX "metas_fechaInicio_idx" ON "metas"("fechaInicio");

-- CreateIndex
CREATE INDEX "metas_fechaFin_idx" ON "metas"("fechaFin");

-- CreateIndex
CREATE INDEX "familias_estatus_idx" ON "familias"("estatus");

-- CreateIndex
CREATE INDEX "miembros_barrioId_idx" ON "miembros"("barrioId");

-- CreateIndex
CREATE INDEX "miembros_nucleoId_idx" ON "miembros"("nucleoId");

-- CreateIndex
CREATE INDEX "miembros_tieneDevocional_idx" ON "miembros"("tieneDevocional");

-- CreateIndex
CREATE INDEX "miembros_fechaRegistro_idx" ON "miembros"("fechaRegistro");

-- CreateIndex
CREATE INDEX "visitas_visitDate_idx" ON "visitas"("visitDate");

-- CreateIndex
CREATE INDEX "visitas_visitStatus_idx" ON "visitas"("visitStatus");

-- CreateIndex
CREATE INDEX "visitas_visitType_idx" ON "visitas"("visitType");

-- CreateIndex
CREATE INDEX "visitas_barrioId_idx" ON "visitas"("barrioId");

-- CreateIndex
CREATE INDEX "visitas_nucleoId_idx" ON "visitas"("nucleoId");

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "barrios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_nucleoId_fkey" FOREIGN KEY ("nucleoId") REFERENCES "nucleos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "barrios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_nucleoId_fkey" FOREIGN KEY ("nucleoId") REFERENCES "nucleos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "comunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
