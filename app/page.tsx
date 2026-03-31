"use client";

import { useState } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Golongan, VehicleClass } from "@prisma/client";
import { LayoutGrid, Loader2, GripVertical, Trash2, Upload, Maximize2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useVehicles, useUpdateVehicleClass, useUploadVehicle, useDeleteVehicle } from "@/hooks/use-vehicles";

const GOLONGAN_ORDER: Golongan[] = [
  "GOL_I", "GOL_II", "GOL_III", "GOL_IVA", "GOL_VA", "GOL_VB", "GOL_VIA", "GOL_VIB", "GOL_VII", "GOL_VIII", "GOL_IX"
];

const GOLONGAN_LABELS: Record<Golongan, string> = {
  GOL_I: "Golongan I",
  GOL_II: "Golongan II",
  GOL_III: "Golongan III",
  GOL_IVA: "Golongan IVa",
  GOL_VA: "Golongan Va",
  GOL_VB: "Golongan Vb",
  GOL_VIA: "Golongan VIa",
  GOL_VIB: "Golongan VIb",
  GOL_VII: "Golongan VII",
  GOL_VIII: "Golongan VIII",
  GOL_IX: "Golongan IX",
};

function VehicleGalleryModal({ 
  isOpen, 
  onClose, 
  items, 
  golonganTitle 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: any[]; 
  golonganTitle: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="p-6 border-b-2 border-black">
          <DialogTitle className="text-xl">
            Characteristics of {golonganTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {items.length === 0 ? (
            <div className="py-20 text-center text-black italic font-bold uppercase opacity-50">No images in this category</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={item.id} className="group relative">
                  <div className="aspect-video w-full overflow-hidden rounded-xl border-2 border-black bg-white shadow-sm">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.imageKeyPath} 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black font-bold uppercase">
                        Image not found
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-black font-bold uppercase tracking-tight">
                    <span>Resource: {item.imageKeyPath}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadVehicleForm() {
  const uploadMutation = useUploadVehicle();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    uploadMutation.mutate(formData, {
      onSuccess: () => {
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <Card className="mb-12 bg-white/50 border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">Upload New Vehicle</CardTitle>
        <CardDescription>Add a new vehicle image to the classification system.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Select Image</Label>
            <Input 
              type="file" 
              name="file" 
              required 
              accept="image/*"
            />
          </div>
          <div className="w-full sm:w-64 space-y-2">
            <Label>Golongan</Label>
            <Select name="golongan" defaultValue={GOLONGAN_ORDER[0]}>
              <SelectTrigger>
                <SelectValue placeholder="Select Golongan" />
              </SelectTrigger>
              <SelectContent>
                {GOLONGAN_ORDER.map(g => (
                  <SelectItem key={g} value={g}>{GOLONGAN_LABELS[g]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="submit" 
            disabled={uploadMutation.isPending}
            className="w-full sm:w-auto"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Vehicle
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SortableItem({ 
  id, 
  imageKey, 
  currentClass, 
  imageUrl, 
  onDelete, 
  onUpdate 
}: {
  id: string;
  imageKey: string;
  currentClass: Golongan;
  imageUrl?: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newClass: Golongan) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="group relative h-44 w-56 shrink-0 overflow-hidden border-2 border-black bg-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
    >
      <div className="h-32 bg-white relative">
        {imageUrl ? (
          <img src={imageUrl} alt={imageKey} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-black font-bold uppercase opacity-50">
            No Preview
          </div>
        )}
        
        <div className="absolute top-2 left-2 pointer-events-none">
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border-black">
            {imageKey.length > 15 ? imageKey.substring(0, 15) + '...' : imageKey}
          </Badge>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="destructive"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="h-8 w-8 rounded-lg shadow-lg border-2 border-black"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardFooter className="h-12 p-0 flex items-center justify-between border-t-2 border-black">
        <div className="flex-1 h-full">
          <Select 
            value={currentClass} 
            onValueChange={(val) => onUpdate(id, val as Golongan)}
          >
            <SelectTrigger className="h-full border-0 rounded-none shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOLONGAN_ORDER.map(g => (
                <SelectItem key={g} value={g}>{GOLONGAN_LABELS[g]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-3 hover:bg-black hover:text-white transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}

function DroppableContainer({ 
  golongan, 
  items, 
  onDelete, 
  onUpdate,
  onOpenGallery 
}: { 
  golongan: Golongan; 
  items: VehicleClass[]; 
  onDelete: (id: string) => void; 
  onUpdate: (id: string, newClass: Golongan) => void;
  onOpenGallery: (golongan: Golongan) => void;
}) {
  const { setNodeRef } = useSortable({
    id: golongan,
    data: {
      type: 'container',
      golongan
    }
  });

  return (
    <Card className="mb-8 overflow-hidden bg-white/40 border-black/10 hover:border-black/30 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b-2 border-dashed border-black/10">
        <div className="flex items-center gap-4">
          <CardTitle className="text-sm">{GOLONGAN_LABELS[golongan]}</CardTitle>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onOpenGallery(golongan)}
            className="h-7 px-3 text-[10px]"
          >
            <Maximize2 className="h-3 w-3 mr-1.5" />
            Full Gallery
          </Button>
        </div>
        <Badge variant="default" className="h-6">
          {items.length} items
        </Badge>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="flex min-h-[160px] w-full gap-6 overflow-x-auto p-4 custom-scrollbar"
      >
        <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
          {items.length === 0 ? (
            <div className="flex w-full items-center justify-center text-[10px] font-bold uppercase opacity-50 italic">
              Drag vehicles here
            </div>
          ) : (
            items.map((item) => (
              <SortableItem 
                key={item.id} 
                id={item.id} 
                imageKey={item.imageKeyPath} 
                currentClass={item.class}
                imageUrl={(item as any).imageUrl}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const updateMutation = useUpdateVehicleClass();
  const deleteMutation = useDeleteVehicle();

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedGolongan, setSelectedGolongan] = useState<Golongan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUpdate = (id: string, newClass: Golongan) => {
    updateMutation.mutate({ id, newClass });
  }

  const handleDelete = (id: string) => {
    setDeleteId(id);
  }

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null)
      });
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeVehicle = vehicles.find((v) => v.id === activeId);
    if (!activeVehicle) return;

    const overGolongan = GOLONGAN_ORDER.find(g => g === overId);
    const overVehicle = vehicles.find((v) => v.id === overId);
    const targetGolongan = overGolongan || overVehicle?.class;

    if (targetGolongan && activeVehicle.class !== targetGolongan) {
      updateMutation.mutate({ id: activeId, newClass: targetGolongan });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-12 px-6 sm:px-12 md:px-24 space-y-12">
        <header className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </header>
        <Skeleton className="h-48 w-full" />
        <div className="space-y-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const galleryItems = selectedGolongan ? vehicles.filter(v => v.class === selectedGolongan) : [];

  return (
    <div className="min-h-screen bg-white py-12 px-6 sm:px-12 md:px-24">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-black p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <LayoutGrid className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter italic">
              Acuan Golongan
            </h1>
          </div>
          <p className="max-w-xl text-black font-bold uppercase text-[10px] tracking-widest opacity-60">
            Internal Logistics Tool &bull; Vehicle Classification Manager &bull; v2.0
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-4 border-2 border-black bg-black text-white">
            {vehicles.length} Total Vehicles
          </Badge>
        </div>
      </header>

      <UploadVehicleForm />

      <main>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={onDragOver}
        >
          {GOLONGAN_ORDER.map((gol) => (
            <DroppableContainer
              key={gol}
              golongan={gol}
              items={vehicles.filter((v) => v.class === gol)}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onOpenGallery={(g) => {
                setSelectedGolongan(g);
                setGalleryOpen(true);
              }}
            />
          ))}
        </DndContext>
      </main>

      <VehicleGalleryModal 
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        golonganTitle={selectedGolongan ? GOLONGAN_LABELS[selectedGolongan] : ""}
        items={galleryItems}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl italic">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-black font-bold uppercase text-xs opacity-70">
              This action cannot be undone. This will permanently delete the vehicle image from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Dismiss</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-black"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #000 transparent;
        }
      `}</style>
    </div>
  );
}
