"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getVehicles, updateVehicleClass, uploadVehicle, deleteVehicle, seedDemoData } from "@/lib/actions";
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
      return uploadVehicle(formData);
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
