"use client";

import { useEffect, useState, useTransition } from "react";
import { 
 DndContext, 
 closestCenter,
 KeyboardSensor,
 PointerSensor,
 useSensor,
 useSensors,
 DragOverEvent,
 DragOverlay,
 defaultDropAnimationSideEffects,
 DropAnimation
} from "@dnd-kit/core";
import {
 arrayMove,
 SortableContext,
 sortableKeyboardCoordinates,
 verticalListSortingStrategy,
 horizontalListSortingStrategy,
 useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getVehicles, updateVehicleClass, uploadVehicle, deleteVehicle, seedDemoData } from "@/lib/actions";
import { Golongan, VehicleClass } from "@prisma/client";
import { LayoutGrid, Loader2, GripVertical, Plus, Trash2, Upload, Maximize2, X } from "lucide-react";

const GOLONGAN_ORDER: Golongan[] = [
 "GOL_I", "GOL_II", "GOL_III", "GOL_IVA", "GOL_VA", "GOL_VIA", "GOL_VII", "GOL_VIII", "GOL_IX"
];

const GOLONGAN_LABELS: Record<Golongan, string> = {
 GOL_I: "Golongan I",
 GOL_II: "Golongan II",
 GOL_III: "Golongan III",
 GOL_IVA: "Golongan IVa",
 GOL_VA: "Golongan Va",
 GOL_VIA: "Golongan VIa",
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
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-2xl flex flex-col shadow-2xl">
 <div className="p-4 border-b flex items-center justify-between">
 <h3 className="text-lg font-bold text-black uppercase tracking-tight">
 Characteristics of {golonganTitle}
 </h3>
 <button 
 onClick={onClose}
 className="p-1 rounded-full hover:bg-white transition-colors"
 >
 <X className="h-6 w-6 text-black" />
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6 space-y-8">
 {items.length === 0 ? (
 <div className="py-20 text-center text-black italic">No images in this category</div>
 ) : (
 items.map((item) => (
 <div key={item.id} className="group relative">
 <div className="aspect-video w-full overflow-hidden rounded-xl bg-white border shadow-sm">
 {item.imageUrl ? (
 <img 
 src={item.imageUrl} 
 alt={item.imageKeyPath} 
 className="w-full h-full object-contain" 
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-black">
 Image not found
 </div>
 )}
 </div>
 <div className="mt-2 flex items-center justify-between text-xs text-black font-medium">
 <span>Resource: {item.imageKeyPath}</span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 );
}

function UploadVehicleForm({ onSuccess }: { onSuccess: () => void }) {
 const [isUploading, setIsUploading] = useState(false);

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 setIsUploading(true);
 const formData = new FormData(e.currentTarget);
 await uploadVehicle(formData);
 setIsUploading(false);
 (e.target as HTMLFormElement).reset();
 onSuccess();
 }

 return (
 <form 
 onSubmit={handleSubmit}
 className="mb-12 flex flex-col gap-4 rounded-2xl border border-black bg-white/50 p-6 sm:flex-row sm:items-end"
 >
 <div className="flex flex-col gap-2">
 <label className="text-xs font-bold text-black uppercase">Select Image</label>
 <input 
 type="file" 
 name="file" 
 required 
 accept="image/*"
 className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-white cursor-pointer"
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-xs font-bold text-black uppercase">Golongan</label>
 <select 
 name="golongan" 
 className="h-10 rounded-full border-black bg-white px-4 text-sm "
 >
 {GOLONGAN_ORDER.map(g => (
 <option key={g} value={g}>{GOLONGAN_LABELS[g]}</option>
 ))}
 </select>
 </div>
 <button 
 type="submit" 
 disabled={isUploading}
 className="flex h-10 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white transition-all hover:bg-white disabled:opacity-50 "
 >
 {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
 Upload Vehicle
 </button>
 </form>
 )
}

interface SortableItemProps {
 id: string;
 imageKey: string;
 currentClass: Golongan;
 imageUrl?: string;
 onDelete: (id: string) => void;
 onUpdate: (id: string, newClass: Golongan) => void;
}

function SortableItem({ id, imageKey, currentClass, imageUrl, onDelete, onUpdate }: SortableItemProps) {
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
 <div
 ref={setNodeRef}
 style={style}
 className="group relative h-40 w-52 shrink-0 overflow-hidden rounded-xl border-2 border-black bg-white shadow-sm transition-all hover:border-black "
 >
 <div className="absolute inset-x-0 top-0 h-32 bg-white ">
 {imageUrl ? (
 <img src={imageUrl} alt={imageKey} className="h-full w-full object-cover" />
 ) : (
 <div className="flex h-full w-full items-center justify-center text-[10px] text-black">
 No Preview
 </div>
 )}
 </div>
 
 <div className="absolute top-1 left-2 pointer-events-none">
 <label className="text-[10px] uppercase font-bold text-white drop-shadow-md">
 {imageKey}
 </label>
 </div>

 <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button 
 onClick={() => onDelete(id)}
 className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-md text-white transition-colors"
 >
 <Trash2 className="h-3 w-3" />
 </button>
 </div>

 <div className="absolute bottom-0 inset-x-0 h-8 flex items-center bg-white/90 px-2 justify-between">
 <select 
 value={currentClass} 
 onChange={(e) => onUpdate(id, e.target.value as Golongan)}
 className="text-[10px] font-bold uppercase bg-transparent text-black outline-none cursor-pointer"
 >
 {GOLONGAN_ORDER.map(g => (
 <option key={g} value={g}>{GOLONGAN_LABELS[g]}</option>
 ))}
 </select>
 <div 
 {...attributes} 
 {...listeners} 
 className="cursor-grab active:cursor-grabbing p-1"
 >
 <GripVertical className="h-3 w-3 text-black" />
 </div>
 </div>
 </div>
 );
}

// Container for each Golongan row
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
 <div className="mb-8">
 <div className="mb-3 flex items-center justify-between px-2">
 <div className="flex items-center gap-3">
 <h2 className="text-sm font-semibold text-black uppercase tracking-wider">
 {GOLONGAN_LABELS[golongan]}
 </h2>
 <button 
 onClick={() => onOpenGallery(golongan)}
 className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight bg-white hover:bg-white text-black rounded-lg transition-colors"
 >
 <Maximize2 className="h-3 w-3" />
 Full Gallery
 </button>
 </div>
 <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded text-black">
 {items.length} items
 </span>
 </div>
 <div
 ref={setNodeRef}
 className="flex min-h-[140px] w-full gap-4 overflow-x-auto rounded-xl border-2 border-dashed border-black bg-white/50 p-4 "
 >
 <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
 {items.map((item) => (
 <SortableItem 
 key={item.id} 
 id={item.id} 
 imageKey={item.imageKeyPath} 
 currentClass={item.class}
 imageUrl={(item as any).imageUrl}
 onDelete={onDelete}
 onUpdate={onUpdate}
 />
 ))}
 {items.length === 0 && (
 <div className="flex w-full items-center justify-center text-xs text-black italic">
 Drag vehicles here
 </div>
 )}
 </SortableContext>
 </div>
 </div>
 );
}

export default function Home() {
 const [vehicles, setVehicles] = useState<VehicleClass[]>([]);
 const [loading, setLoading] = useState(true);
 const [isPending, startTransition] = useTransition();

 const [galleryOpen, setGalleryOpen] = useState(false);
 const [selectedGolongan, setSelectedGolongan] = useState<Golongan | null>(null);

 const sensors = useSensors(
 useSensor(PointerSensor),
 useSensor(KeyboardSensor, {
 coordinateGetter: sortableKeyboardCoordinates,
 })
 );

 async function refreshData() {
 const data = await getVehicles();
 setVehicles(data);
 }

 useEffect(() => {
 async function init() {
 // Seed if empty for demo
 await seedDemoData();
 await refreshData();
 setLoading(false);
 }
 init();
 }, []);

 const handleUpdate = async (id: string, newClass: Golongan) => {
 // Optimistic update
 setVehicles(prev => prev.map(v => v.id === id ? { ...v, class: newClass } : v));
 await updateVehicleClass(id, newClass);
 await refreshData();
 }

 const handleDelete = async (id: string) => {
 if (confirm("Delete this vehicle?")) {
 await deleteVehicle(id);
 await refreshData();
 }
 }

 const handleOpenGallery = (golongan: Golongan) => {
 setSelectedGolongan(golongan);
 setGalleryOpen(true);
 }

 const onDragOver = (event: DragOverEvent) => {
// ... (omitting intermediate for brevity, will apply carefully)
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
 setVehicles((prev) => {
 return prev.map((v) => {
 if (v.id === activeId) {
 return { ...v, class: targetGolongan };
 }
 return v;
 });
 });

 startTransition(async () => {
 await updateVehicleClass(activeId, targetGolongan);
 });
 }
 };

 if (loading) {
 return (
 <div className="flex h-screen items-center justify-center bg-white ">
 <Loader2 className="h-8 w-8 animate-spin text-black" />
 </div>
 );
 }

 const galleryItems = selectedGolongan ? vehicles.filter(v => v.class === selectedGolongan) : [];

 return (
 <div className="min-h-screen bg-white py-12 px-6 sm:px-12 md:px-24">
 <header className="mb-12">
 <div className="flex items-center gap-3 mb-2">
 <div className="bg-black p-2 rounded-lg ">
 <LayoutGrid className="h-6 w-6 text-white " />
 </div>
 <h1 className="text-2xl font-bold text-black ">
 Acuan Golongan
 </h1>
 </div>
 <p className="max-w-xl text-black ">
 Upload and organize vehicle classifications by dragging them across categories.
 </p>
 </header>

 <UploadVehicleForm onSuccess={refreshData} />

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
 onOpenGallery={handleOpenGallery}
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
 </div>
 );
}
