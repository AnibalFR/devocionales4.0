/*
  Warnings:

  - Made the column `barrioId` on table `nucleos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "nucleos" ALTER COLUMN "barrioId" SET NOT NULL;
