import type { DemoState } from "./types";

export function confirmClassAgenda(state: DemoState): DemoState {
  const finished = new Set(
    [...state.lessons, ...state.archived.map((entry) => entry.lesson)]
      .filter((lesson) => lesson.status === "processing" || lesson.status === "done")
      .map((lesson) => lesson.id),
  );
  let changed = false;
  const agenda = state.agenda.map((item) => {
    if (!item.confirmed && item.sourceSessionId && finished.has(item.sourceSessionId)) {
      changed = true;
      return { ...item, confirmed: true };
    }
    return item;
  });
  return changed ? { ...state, agenda } : state;
}
