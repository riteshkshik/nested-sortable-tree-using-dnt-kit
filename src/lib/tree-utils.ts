// src/lib/tree-utils.ts

import { UniqueIdentifier } from "@dnd-kit/core";

// --- UPDATED INTERFACE ---
// We've added label, color, and isChecked
export interface TreeItem {
  id: UniqueIdentifier;
  children: TreeItem[];
  label: string;
  color: string; // Will hold a Tailwind color class (e.g., 'bg-blue-500')
  isChecked: boolean;
}

// FlattenedItem now includes the new properties
export interface FlattenedItem extends TreeItem {
  parentId: UniqueIdentifier | null;
  depth: number;
}

// --- UPDATED INITIAL DATA ---
// We now match the data structure from the screenshot
export const initialTree: TreeItem[] = [
  {
    id: "1",
    label: "Marketing Campaign",
    color: "red",
    isChecked: true,
    children: [
      {
        id: "1-1",
        label: "Create Ad Copies",
        color: "pink",
        isChecked: true,
        children: [],
      },
      {
        id: "1-2",
        label: "Design Landing Page",
        color: "purple",
        isChecked: false,
        children: [],
      },
    ],
  },
  {
    id: "2",
    label: "Product Roadmap",
    color: "blue",
    isChecked: true,
    children: [
      {
        id: "2-1",
        label: "Define Q1 Goals",
        color: "teal",
        isChecked: true,
        children: [],
      },
      {
        id: "2-2",
        label: "Feature Prioritization",
        color: "yellow",
        isChecked: true,
        children: [],
      },
    ],
  },
  {
    id: "3",
    label: "User Research",
    color: "green",
    isChecked: false,
    children: [
      {
        id: "3-1",
        label: "Interview Users",
        color: "orange",
        isChecked: true,
        children: [],
      },
    ],
  },
  {
    id: "4",
    label: "Backend Tasks",
    color: "gray",
    isChecked: true,
    children: [
      {
        id: "4-1",
        label: "Optimize Database Queries",
        color: "black",
        isChecked: true,
        children: [],
      },
      {
        id: "4-2",
        label: "Refactor API Endpoints",
        color: "blue",
        isChecked: false,
        children: [],
      },
    ],
  },
  {
    id: "5",
    label: "Frontend Tasks",
    color: "purple",
    isChecked: true,
    children: [
      {
        id: "5-1",
        label: "Fix UI Alignment",
        color: "indigo",
        isChecked: true,
        children: [],
      },
    ],
  },
  {
    id: "6",
    label: "Content Calendar",
    color: "orange",
    isChecked: true,
    children: [
      {
        id: "6-1",
        label: "Write Blog Article",
        color: "brown",
        isChecked: true,
        children: [],
      },
      {
        id: "6-2",
        label: "Plan Social Media Posts",
        color: "cyan",
        isChecked: true,
        children: [],
      },
    ],
  },
  {
    id: "7",
    label: "Release v1.0.0",
    color: "teal",
    isChecked: true,
    children: [
      {
        id: "7-1",
        label: "Prepare Release Notes",
        color: "yellow",
        isChecked: true,
        children: [],
      },
      {
        id: "7-2",
        label: "Smoke Testing",
        color: "red",
        isChecked: true,
        children: [],
      },
    ],
  },
];

// --- UTILITY FUNCTIONS (No changes) ---

export function flattenTree(
  items: TreeItem[],
  parentId: UniqueIdentifier | null = null,
  depth = 0
): FlattenedItem[] {
  return items.reduce((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth },
      ...flattenTree(item.children, item.id, depth + 1),
    ];
  }, [] as FlattenedItem[]);
}

export function buildTree(flattenedItems: FlattenedItem[]): TreeItem[] {
  const rootItems: TreeItem[] = [];
  const itemsById: { [key: string]: TreeItem & { children: TreeItem[] } } = {};

  flattenedItems.forEach((item) => {
    itemsById[item.id] = { ...item, children: [] };
  });

  flattenedItems.forEach((item) => {
    const { id, parentId } = item;
    if (parentId === null) {
      rootItems.push(itemsById[id]);
    } else {
      const parent = itemsById[parentId];
      if (parent) {
        parent.children.push(itemsById[id]);
      }
    }
  });

  return rootItems;
}

export function findItem(items: FlattenedItem[], id: UniqueIdentifier) {
  return items.find((item) => item.id === id);
}

export function getItemIds(items: FlattenedItem[]): UniqueIdentifier[] {
  return items.map(({ id }) => id);
}

export function getDescendantIds(
  items: FlattenedItem[],
  parentId: UniqueIdentifier
): UniqueIdentifier[] {
  const descendants: UniqueIdentifier[] = [];

  // Find direct children
  const children = items.filter((item) => item.parentId === parentId);

  // For each child, add its ID and recursively get its descendants
  for (const child of children) {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(items, child.id));
  }

  return descendants;
}
