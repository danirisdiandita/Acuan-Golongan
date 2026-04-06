"use server";

import { prisma } from "./prisma";
import { Golongan } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getPresignedDownloadUrl, uploadFileToS3, deleteFromS3, getPresignedUploadUrl } from "./s3";
import { sendToDiscord } from "./discord";

export async function getVehicles() {
  const vehicles = await prisma.vehicleClass.findMany();

  // Add presigned URLs
  const vehiclesWithUrls = await Promise.all(
    vehicles.map(async (v: any) => ({
      ...v,
      imageUrl: await getPresignedDownloadUrl(v.imageKeyPath),
    }))
  );

  return vehiclesWithUrls;
}

export async function updateVehicleClass(id: string, newClass: Golongan) {
  await prisma.vehicleClass.update({
    where: { id },
    data: { class: newClass },
  });
  revalidatePath("/");
}

export async function getUploadUrl(filename: string, fileType: string) {
  return await getPresignedUploadUrl(filename, fileType);
}

export async function finalizeVehicleUpload(key: string, golongan: Golongan, shouldNotifyDiscord: boolean = false) {
  await prisma.vehicleClass.create({
    data: {
      imageKeyPath: key,
      class: golongan,
    },
  });

  if (golongan === "UNKNOWN" && shouldNotifyDiscord) {
    const imageUrl = await getPresignedDownloadUrl(key);
    if (imageUrl) {
      await sendToDiscord(imageUrl, "aku nggak tau golongan apa ini apakah ada yang bisa dibantu?");
    }
  }

  revalidatePath("/");
}

export async function uploadVehicle(formData: FormData) {
  const file = formData.get("file") as File;
  const golongan = formData.get("golongan") as Golongan;

  if (!file || !golongan) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadFileToS3(buffer, file.name, file.type);

  await prisma.vehicleClass.create({
    data: {
      imageKeyPath: key,
      class: golongan,
    },
  });

  revalidatePath("/");
}

export async function deleteVehicle(id: string) {
  const vehicle = await prisma.vehicleClass.findUnique({
    where: { id },
  });

  if (vehicle) {
    try {
      await deleteFromS3(vehicle.imageKeyPath);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }

    try {
      await prisma.vehicleClass.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  }

  revalidatePath("/");
}

// Helper to seed some data if needed for the demo
export async function seedDemoData() {
  const count = await prisma.vehicleClass.count();
  if (count === 0) {
    await prisma.vehicleClass.createMany({
      data: [
        { imageKeyPath: "demo1.png", class: "GOL_I" },
        { imageKeyPath: "demo2.png", class: "GOL_II" },
        { imageKeyPath: "demo3.png", class: "GOL_III" },
      ],
    });
    revalidatePath("/");
  }
}
