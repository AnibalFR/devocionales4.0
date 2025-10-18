-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('CEA', 'COLABORADOR', 'VISITANTE');

-- CreateEnum
CREATE TYPE "TipoVisita" AS ENUM ('DEVOCIONAL', 'EVANGELIZACION', 'SEGUIMIENTO', 'EMERGENCIA', 'OTRA');

-- CreateTable
CREATE TABLE "comunidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "comunidadId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barrios" (
    "id" TEXT NOT NULL,
    "comunidadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barrios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nucleos" (
    "id" TEXT NOT NULL,
    "comunidadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nucleos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "familias" (
    "id" TEXT NOT NULL,
    "comunidadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "barrio" TEXT,
    "barrioId" TEXT,
    "nucleoId" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembros" (
    "id" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "email" TEXT,
    "parentesco" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miembros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoVisita" NOT NULL,
    "proposito" TEXT,
    "notas" TEXT,
    "tema" TEXT,
    "asistentes" INTEGER,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_comunidadId_idx" ON "usuarios"("comunidadId");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE INDEX "barrios_comunidadId_idx" ON "barrios"("comunidadId");

-- CreateIndex
CREATE INDEX "nucleos_comunidadId_idx" ON "nucleos"("comunidadId");

-- CreateIndex
CREATE INDEX "familias_comunidadId_idx" ON "familias"("comunidadId");

-- CreateIndex
CREATE INDEX "familias_barrioId_idx" ON "familias"("barrioId");

-- CreateIndex
CREATE INDEX "familias_nucleoId_idx" ON "familias"("nucleoId");

-- CreateIndex
CREATE INDEX "familias_activa_idx" ON "familias"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "miembros_usuarioId_key" ON "miembros"("usuarioId");

-- CreateIndex
CREATE INDEX "miembros_familiaId_idx" ON "miembros"("familiaId");

-- CreateIndex
CREATE INDEX "miembros_usuarioId_idx" ON "miembros"("usuarioId");

-- CreateIndex
CREATE INDEX "visitas_familiaId_idx" ON "visitas"("familiaId");

-- CreateIndex
CREATE INDEX "visitas_creadoPorId_idx" ON "visitas"("creadoPorId");

-- CreateIndex
CREATE INDEX "visitas_fecha_idx" ON "visitas"("fecha");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "comunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barrios" ADD CONSTRAINT "barrios_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "comunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nucleos" ADD CONSTRAINT "nucleos_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "comunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "comunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "barrios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_nucleoId_fkey" FOREIGN KEY ("nucleoId") REFERENCES "nucleos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros" ADD CONSTRAINT "miembros_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
