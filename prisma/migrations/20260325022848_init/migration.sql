-- CreateEnum
CREATE TYPE "Golongan" AS ENUM ('Golongan I', 'Golongan II', 'Golongan III', 'Golongan IVa', 'Golongan Va', 'Golongan VIa', 'Golongan VII', 'Golongan VIII', 'Golongan IX');

-- CreateTable
CREATE TABLE "vehicle_class" (
    "id" TEXT NOT NULL,
    "image_key_path" TEXT NOT NULL,
    "class" "Golongan" NOT NULL,

    CONSTRAINT "vehicle_class_pkey" PRIMARY KEY ("id")
);
