'use client'
import { useState, useEffect } from "react";
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
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Golongan, VehicleClass } from "@prisma/client";
import { LayoutGrid, Loader2, GripVertical, Trash2, Upload, Maximize2, EyeOff, Eye, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { useVehicles, useUpdateVehicleClass, useUploadVehicle, useDeleteVehicle, useBulkUploadVehicles } from "@/hooks/use-vehicles";

const GOLONGAN_ORDER: Golongan[] = [
  "GOL_I", "GOL_II", "GOL_III", "GOL_IVA", "GOL_VA", "GOL_VB", "GOL_VIA", "GOL_VIB", "GOL_VII", "GOL_VIII", "GOL_IX", "UNKNOWN"
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
  UNKNOWN: "Unknown",
};

function VehicleGalleryModal({
  isOpen,
  onClose,
  items,
  golonganTitle,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  golonganTitle: string;
  onUpdate: (id: string, newClass: Golongan) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] overflow-hidden flex flex-col p-0 border border-slate-200 shadow-2xl rounded-[2.5rem] bg-slate-50/50 backdrop-blur-xl">
        <DialogHeader className="p-8 border-b bg-white/80 backdrop-blur-md">
          <DialogTitle className="text-4xl font-extrabold tracking-tight text-slate-900">
            {golonganTitle} <span className="text-slate-400 font-medium text-2xl ml-2">— Characteristics</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          {items.length === 0 ? (
            <div className="py-40 text-center text-slate-300 font-medium text-xl italic">No representative images found for this category yet.</div>
          ) : (
            <div className="flex flex-col gap-20 max-w-6xl mx-auto">
              {items.map((item) => (
                <div key={item.id} className="group relative space-y-6">
                  <div className="w-full overflow-hidden rounded-[2rem] border border-white bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-transform duration-500 hover:scale-[1.01]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.imageKeyPath}
                        className="w-full h-auto object-contain min-h-[500px]"
                      />
                    ) : (
                      <div className="w-full h-80 flex items-center justify-center text-slate-400 font-medium">
                        Image Unavailable
                      </div>
                    )}
                  </div>
                  <div className="px-6 flex items-center justify-between gap-4">
                    <Badge variant="secondary" className="bg-white text-slate-500 font-medium px-4 py-1.5 rounded-full border shadow-sm uppercase tracking-wider text-[10px]">
                      Asset: {item.imageKeyPath}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Re-classify:</span>
                      <Select
                        value={item.class}
                        onValueChange={(val) => onUpdate(item.id, val as Golongan)}
                      >
                        <SelectTrigger className="w-48 h-9 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-xs text-slate-600 focus:ring-indigo-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GOLONGAN_ORDER.map(g => (
                            <SelectItem key={g} value={g} className="text-xs font-semibold">{GOLONGAN_LABELS[g]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Single Upload</CardTitle>
        <CardDescription className="text-[11px]">Add a specific vehicle with its category.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image Asset</Label>
            <Input
              type="file"
              name="file"
              required
              accept="image/*"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Category</Label>
            <Select name="golongan" defaultValue={GOLONGAN_ORDER[0]}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Golongan" />
              </SelectTrigger>
              <SelectContent>
                {GOLONGAN_ORDER.map(g => (
                  <SelectItem key={g} value={g} className="text-xs">{GOLONGAN_LABELS[g]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            className="w-full h-9 text-xs font-bold"
          >
            {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
            Process Single
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function BulkUploadVehicleForm() {
  const bulkUploadMutation = useBulkUploadVehicles();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const files = Array.from(fileInput.files || []);
    
    if (files.length === 0) return;

    bulkUploadMutation.mutate(files, {
      onSuccess: () => {
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <Card className="bg-indigo-50/50 border-indigo-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-12 -mt-12 rounded-full" />
      <CardHeader>
        <CardTitle className="text-sm font-bold text-indigo-700">Bulk Multi-Upload</CardTitle>
        <CardDescription className="text-[11px] text-indigo-600/70">
          Upload multiple assets. **Note: All files will be automatically categorized as <span className="font-bold underline">UNKNOWN</span> for later classification.**
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Multiple Assets</Label>
            <Input
              type="file"
              name="files"
              required
              multiple
              accept="image/*"
              className="h-9 text-xs bg-white border-indigo-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="h-[54px] flex items-center bg-indigo-100/30 p-3 rounded-lg border border-indigo-100/50">
             <p className="text-[10px] font-bold text-indigo-600 leading-tight">
               <span className="opacity-70 mr-1">Triage Protocol:</span>
               Current configuration will automatically route these items to the "Unknown" bucket for manual review.
             </p>
          </div>
          <Button
            type="submit"
            disabled={bulkUploadMutation.isPending}
            className="w-full h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
          >
            {bulkUploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
            Execute Bulk Upload to UNKNOWN
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
      className="group relative h-48 w-full overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 active:scale-95 rounded-2xl"
    >
      <div className="h-36 bg-slate-50 relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={imageKey} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
            No Preview
          </div>
        )}

        <div className="absolute top-3 left-3 pointer-events-none">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-md border-slate-200 text-slate-600 shadow-sm">
            {imageKey.length > 20 ? imageKey.substring(0, 20) + '...' : imageKey}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="h-8 w-8 rounded-full shadow-lg border border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardFooter className="h-12 p-0 flex items-center justify-between border-t border-slate-100 bg-white">
        <div className="flex-1 h-full">
          <Select
            value={currentClass}
            onValueChange={(val) => onUpdate(id, val as Golongan)}
          >
            <SelectTrigger className="h-full border-0 rounded-none shadow-none focus:ring-0 text-slate-600 font-medium text-xs hover:bg-slate-50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOLONGAN_ORDER.map(g => (
                <SelectItem key={g} value={g} className="text-xs font-medium">{GOLONGAN_LABELS[g]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
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
  onOpenGallery,
  onHide
}: {
  golongan: Golongan;
  items: VehicleClass[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, newClass: Golongan) => void;
  onOpenGallery: (golongan: Golongan) => void;
  onHide: (golongan: Golongan) => void;
}) {
  const { setNodeRef } = useSortable({
    id: golongan,
    data: {
      type: 'container',
      golongan
    }
  });

  return (
    <Card className="flex flex-col h-full bg-slate-50/30 border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group/container">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-5 space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <CardTitle className="text-xs font-bold text-slate-700 tracking-tight">{GOLONGAN_LABELS[golongan]}</CardTitle>
          <div className="flex gap-1 opacity-0 group-hover/container:opacity-100 transition-all translate-x-1 group-hover/container:translate-x-0">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenGallery(golongan)}
              className="h-6 w-6 rounded-lg bg-white shadow-sm border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onHide(golongan)}
              className="h-6 w-6 rounded-lg text-slate-400 hover:text-red-500"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Badge variant="secondary" className="h-6 px-2.5 bg-slate-200/50 text-slate-600 font-bold text-[9px] border-white shadow-inner">
          {items.length}
        </Badge>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-4 p-4 min-h-[300px]"
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
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

  // Persistence for hidden categories
  const [hiddenCategories, setHiddenCategories] = useState<Golongan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("asdp_hidden_categories");
    if (saved) {
      try {
        setHiddenCategories(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse hidden categories", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("asdp_hidden_categories", JSON.stringify(hiddenCategories));
    }
  }, [hiddenCategories, isLoaded]);

  const toggleCategory = (golongan: Golongan) => {
    setHiddenCategories(prev =>
      prev.includes(golongan)
        ? prev.filter(g => g !== golongan)
        : [...prev, golongan]
    );
  }

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
      <div className="min-h-screen bg-[#f8fafc] py-12 px-6 sm:px-12 md:px-16 space-y-12">
        <header className="flex justify-between items-end">
          <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-48 rounded-full" />
        </header>
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const galleryItems = selectedGolongan ? vehicles.filter(v => v.class === selectedGolongan) : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-100">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1600px] mx-auto py-12 px-6 sm:px-12 md:px-16 space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-200">
                <LayoutGrid className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  Acuan <span className="text-indigo-600">Golongan</span>
                </h1>
                <p className="text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest flex items-center gap-2">
                  <span>Smart Classification Fleet</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>v2.4 PRO</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border p-1 rounded-full flex items-center gap-3 pr-4 shadow-sm">
              <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter">
                Connected
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                {vehicles.length} Units Cataloged
              </span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 backdrop-blur-md border border-slate-200/50 p-6 rounded-[2.5rem] shadow-sm">
          <UploadVehicleForm />
          <BulkUploadVehicleForm />
        </section>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 flex items-center gap-3 group transition-all">
                  <div className="bg-indigo-50 p-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm tracking-tight">Active Viewports</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-2" align="start">
                <DropdownMenuLabel className="px-3 pt-3 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Category Visibility
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 mx-2 mb-2" />
                <div className="grid grid-cols-1 gap-1">
                  {GOLONGAN_ORDER.map(gol => (
                    <DropdownMenuCheckboxItem
                      key={gol}
                      checked={!hiddenCategories.includes(gol)}
                      onCheckedChange={() => toggleCategory(gol)}
                      className="rounded-lg h-9 font-semibold text-slate-600 focus:bg-slate-50 focus:text-indigo-600"
                    >
                      {GOLONGAN_LABELS[gol]}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                System optimized &bull; {GOLONGAN_ORDER.length - hiddenCategories.length} Categories Engaged
              </div>
            </div>
          </div>

          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={onDragOver}
        >
          {GOLONGAN_ORDER.filter(gol => !hiddenCategories.includes(gol)).map((gol) => (
            <DroppableContainer
              key={gol}
              golongan={gol}
              items={vehicles.filter((v) => v.class === gol)}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onHide={toggleCategory}
              onOpenGallery={(g) => {
                setSelectedGolongan(g);
                setGalleryOpen(true);
              }}
            />
          ))}
        </DndContext>
      </main>
    </div>
  </div>

    <VehicleGalleryModal
      isOpen={galleryOpen}
      onClose={() => setGalleryOpen(false)}
      golonganTitle={selectedGolongan ? GOLONGAN_LABELS[selectedGolongan] : ""}
      items={galleryItems}
      onUpdate={handleUpdate}
    />

    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <AlertDialogContent className="border border-slate-200 shadow-2xl rounded-3xl bg-white/90 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Final Confirmation</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
            Are you absolutely sure? This will permanently remove the vehicle asset from the centralized classified group. This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3">
          <AlertDialogCancel className="rounded-xl border-slate-200">Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-red-500 hover:bg-red-600 rounded-xl px-6 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
      `}</style>
    </div>
  );
}
