// src/components/SortableTree.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  DragMoveEvent, // 1. Import DragMoveEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  initialTree,
  flattenTree,
  buildTree, // We will use this soon
  getItemIds,
  FlattenedItem,
  findItem,
  getDescendantIds,
} from "@/lib/tree-utils";

// --- Color Map (No changes) ---
const colorMap: { [key: string]: string } = {
  red: "#EF4444",
  blue: "#3B82F6",
  gray: "#D1D5DB",
  teal: "#14B8A6",
  green: "#22C55E",
  purple: "#A855F7",
  default: "#6B7280",
};

// --- ColoredCheckbox (No changes) ---
function ColoredCheckbox({
  color,
  isChecked,
}: {
  color: string;
  isChecked: boolean;
}) {
  const style = {
    backgroundColor: isChecked
      ? colorMap[color] || colorMap.default
      : colorMap.gray,
  };
  return (
    <div
      style={style}
      className="w-5 h-5 rounded flex items-center justify-center"
    >
      {isChecked && (
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
}

// --- Static Item (UPDATED) ---
// We add a new 'style' prop for the drag overlay's horizontal movement
const Item = React.forwardRef<
  HTMLDivElement,
  { item: FlattenedItem; style?: React.CSSProperties; indentation: number } // 2. Add indentation
>(({ item, style, indentation, ...props }, ref) => {
  const itemStyle = {
    paddingLeft: `${indentation}px`, // Use passed-in indentation
    ...style,
  };
  return (
    <div
      ref={ref}
      style={itemStyle}
      className="flex items-center my-2 p-1 bg-white shadow-sm rounded"
      {...props}
    >
      <ColoredCheckbox color={item.color} isChecked={item.isChecked} />
      <span className="ml-3 text-gray-800">{item.label}</span>
    </div>
  );
});
Item.displayName = "Item";

// --- SortableItem (UPDATED) ---
function SortableItem({
  item,
  activeDescendantIds,
}: {
  item: FlattenedItem;
  activeDescendantIds: UniqueIdentifier[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const isDescendant = activeDescendantIds.includes(item.id);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDescendant) {
    return null;
  }

  return (
    <Item
      ref={setNodeRef}
      item={item}
      indentation={item.depth * 24} // 3. Pass in the item's depth
      style={style}
      {...attributes}
      {...listeners}
    />
  );
}

// --- THE MAIN COMPONENT (handleDragEnd is UPDATED) ---
export function SortableTree() {
  const [items, setItems] = useState(() => flattenTree(initialTree));
  const itemIds = React.useMemo(() => getItemIds(items), [items]);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeItem, setActiveItem] = useState<FlattenedItem | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const maxAllowedDepth = 100;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const activeDescendantIds = useMemo(() => {
    if (!activeId) return [];
    return getDescendantIds(items, activeId);
  }, [activeId, items]);

  function handleDragStart(event: DragStartEvent) {
    const item = findItem(items, event.active.id);
    setActiveItem(item || null);
    setActiveId(event.active.id);
    setDragOffset(0); // Reset offset
  }

  function handleDragMove(event: DragMoveEvent) {
    setDragOffset(event.delta.x);
  }

  function handleDragCancel() {
    setActiveItem(null);
    setActiveId(null);
    setDragOffset(0);
  }

  // --- THIS IS THE NEW, SIMPLER handleDragEnd ---
  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    setActiveId(null);

    const { active, over } = event;
    const indentationWidth = 24;

    if (!over) {
      setDragOffset(0);
      return;
    }

    const activeItem = findItem(items, active.id);
    const overItem = findItem(items, over.id);

    if (!activeItem || !overItem) {
      setDragOffset(0);
      return;
    }

    // 1. Calculate projected depth
    const projectedDepth =
      activeItem.depth + Math.round(dragOffset / indentationWidth);
    const minDepth = 0;
    let newDepth = Math.max(minDepth, projectedDepth);
    const isIndenting = newDepth !== activeItem.depth;

    setItems((prevItems) => {
      // Find original indices
      const oldIndex = prevItems.findIndex((item) => item.id === active.id);
      const newIndex = prevItems.findIndex((item) => item.id === over.id);

      // Get all descendants
      const descendantIds = getDescendantIds(prevItems, active.id);

      // --- This section updates the items array ---
      let newParentId: UniqueIdentifier | null;
      let depthDifference: number;

      // Find the parent and depth based on horizontal drag
      if (isIndenting) {
        const overIndex = prevItems.findIndex((item) => item.id === over.id);
        const newParent = prevItems
          .slice(0, overIndex)
          .reverse()
          .find((item) => item.depth < newDepth);

        const parentDepth = newParent ? newParent.depth : -1;
        if (newDepth > parentDepth + 1) {
          newDepth = parentDepth + 1;
        }

        newParentId = newParent ? newParent.id : null;
        depthDifference = newDepth - activeItem.depth;
      } else {
        // Not indenting, so adopt the sibling's parent and depth
        newParentId = overItem.parentId;
        newDepth = overItem.depth;
        depthDifference = newDepth - activeItem.depth;
      }

      // --- Clamp depth based on maxAllowedDepth ---
      const deepestDescendantDepth = descendantIds.length
        ? Math.max(
            ...descendantIds.map(
              (id) => prevItems.find((item) => item.id === id)!.depth
            )
          )
        : activeItem.depth;
      const projectedMaxDescendantDepth =
        deepestDescendantDepth + depthDifference;

      if (projectedMaxDescendantDepth > maxAllowedDepth) {
        // Cancel the indent/reparent
        newParentId = activeItem.parentId;
        newDepth = activeItem.depth;
        depthDifference = 0;
      }

      // 1. Create a new array with updated depths and parent IDs
      const updatedItems = prevItems.map((item) => {
        if (item.id === active.id) {
          return {
            ...item,
            parentId: newParentId,
            depth: newDepth,
          };
        }
        if (descendantIds.includes(item.id)) {
          return {
            ...item,
            depth: item.depth + depthDifference,
          };
        }
        return item;
      });

      // 2. Get the block of items to move
      const itemsToMove = [
        updatedItems[oldIndex],
        ...descendantIds.map((id) =>
          updatedItems.find((item) => item.id === id)
        ),
      ].filter(Boolean) as FlattenedItem[];

      // 3. Create the new array *without* the moved items
      let newItems = updatedItems.filter(
        (item) => item.id !== active.id && !descendantIds.includes(item.id)
      );

      // 4. Find the correct insertion point
      let insertionIndex = newItems.findIndex((item) => item.id === over.id);
      const isMovingDown = oldIndex < newIndex;
      const isOutdenting = isIndenting && depthDifference < 0;

      if (insertionIndex === -1) {
        if (isOutdenting) {
          insertionIndex = newItems.findIndex(
            (item) => item.id === activeItem.parentId
          );
        } else {
          insertionIndex =
            oldIndex > newItems.length ? newItems.length : oldIndex;
        }
      }

      // 5. Insert the items
      if (isMovingDown || isOutdenting) {
        newItems.splice(insertionIndex + 1, 0, ...itemsToMove);
      } else {
        newItems.splice(insertionIndex, 0, ...itemsToMove);
      }

      return newItems;
    });

    setDragOffset(0); // Reset offset
  }

  // --- THIS IS THE FINAL FIX ---
  // This effect runs *after* every drag operation
  useEffect(() => {
    // Only run if we're not dragging
    if (!activeId) {
      // 1. Build a *nested* tree from our flat array
      const nestedTree = buildTree(items);

      // 2. Re-flatten the tree. This rebuilds all parentId/depth
      //    relationships from the visual structure.
      const newFlattenedTree = flattenTree(nestedTree);

      // 3. Set the state. This is a "correction" step.
      setItems(newFlattenedTree);
    }
  }, [activeId]); // This runs once, after the drag is complete
  // --- END OF FIX ---

  if (!hasMounted) {
    return null;
  }

  return (
    // 8. Add all new handlers to DndContext
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="p-4 max-w-xm mx-auto bg-gray-100 rounded-lg shadow-md">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              activeDescendantIds={activeDescendantIds}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div style={{ width: 250 }}>
            {/* 9. We now calculate indentation for the overlay */}
            <Item
              item={activeItem}
              indentation={activeItem.depth * 24 + dragOffset}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
