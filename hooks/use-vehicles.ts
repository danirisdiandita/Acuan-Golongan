"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getVehicles, updateVehicleClass, uploadVehicle, deleteVehicle, seedDemoData, getUploadUrl, finalizeVehicleUpload } from "@/lib/actions";
import { Golongan } from "@prisma/client";

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      return getVehicles();
    },
  });
}

export function useUpdateVehicleClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newClass }: { id: string; newClass: Golongan }) => {
      return updateVehicleClass(id, newClass);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUploadVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const file = formData.get("file") as File;
      const golongan = formData.get("golongan") as Golongan;

      if (!file || !golongan) throw new Error("Missing file or golongan");

      // 1. Get presigned URL securely from server
      const { url, key } = await getUploadUrl(file.name, file.type);

      // 2. Direct browser upload to S3
      const response = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) throw new Error("Failed to upload to storage provider");

      // 3. Inform server to finalize record in DB
      return finalizeVehicleUpload(key, golongan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useBulkUploadVehicles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results = await Promise.all(
        files.map(async (file) => {
          // 1. Get presigned URL securely from server
          const { url, key } = await getUploadUrl(file.name, file.type);

          // 2. Direct browser upload to S3
          const response = await fetch(url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!response.ok) throw new Error(`Failed to upload ${file.name} to storage provider`);

          // 3. Inform server to finalize record in DB with UNKNOWN class
          return finalizeVehicleUpload(key, "UNKNOWN");
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteVehicle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
