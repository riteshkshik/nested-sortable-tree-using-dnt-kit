// src/app/page.tsx
import { SortableTree } from "@/components/SortableTree";

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        Sortable Tree with dnd-kit
      </h1>
      <SortableTree />
    </main>
  );
}
