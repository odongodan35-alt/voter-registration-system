/*
  Warnings:

  - A unique constraint covering the columns `[id_number]` on the table `voter_records` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "voter_records" ADD COLUMN     "id_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "voter_records_id_number_key" ON "voter_records"("id_number");
