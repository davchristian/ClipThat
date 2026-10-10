import type { DemoState } from "@/lib/types";

// Persistence boundary for the frontend demo. Replace these functions with API calls later.
const storageKey = "clipthat-frontend-v1";

export function readStoredState(): DemoState | null {
  const value = localStorage.getItem(storageKey);
  if (!value) return null;
  const saved = JSON.parse(value) as DemoState;
  if (!saved || typeof saved !== "object") return null;
  if (
    ["student", "lecturer"].includes(saved.role) &&
    ["lessons", "questions", "saved", "agenda", "archived", "graph"].every((key) =>
      Array.isArray(saved[key as keyof DemoState]),
    ) &&
    saved.notes &&
    saved.materials
  )
    return saved;
  return null;
}

export function writeStoredState(data: DemoState) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}
