import type { DemoState } from "@/lib/types";
import { initialState } from "./mock/initial-state";

// Demo-only persistence. Live accounts are loaded through the API in AppProvider.
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
    return {
      ...saved,
      questions: saved.questions,
      agenda: saved.agenda.map((item) => {
        const original = initialState.agenda.find((entry) => entry.id === item.id);
        return !item.sourceSessionId && original?.sourceSessionId
          ? { ...item, sourceSessionId: original.sourceSessionId }
          : item;
      }),
    };
  return null;
}

export function writeStoredState(data: DemoState) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}
