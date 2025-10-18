-- AlterTable
ALTER TABLE "nucleos" ADD COLUMN     "barrioId" TEXT;

-- CreateIndex
CREATE INDEX "nucleos_barrioId_idx" ON "nucleos"("barrioId");

-- AddForeignKey
ALTER TABLE "nucleos" ADD CONSTRAINT "nucleos_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "barrios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
