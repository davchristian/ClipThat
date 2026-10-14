"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { initialState } from "@/lib/demo-data";
import { Toast, type ToastData, type ToastOptions } from "@/components/toast";
import type { DemoState } from "@/lib/types";
import { liveMode } from "@/lib/app-mode";
type Context = {
  data: DemoState;
  ready: boolean;
  update: (fn: (data: DemoState) => DemoState) => void;
  notify: (message: string, options?: ToastOptions) => void;
  reset: () => void;
};
const AppContext = createContext<Context | null>(null);
const storageKey = "clipthat-frontend-v1";
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const notify = useCallback(
    (text: string, { kind = "success", action }: ToastOptions = {}) =>
      setToast({ text, kind, action, id: Date.now() }),
    [],
  );
  const clearToast = useCallback(() => setToast(null), []);
  useEffect(() => {
    if (liveMode) {
      setReady(true);
      return;
    }
    try {
      const value = localStorage.getItem(storageKey);
      if (value) {
        const saved = JSON.parse(value) as DemoState;
        if (
          ["student", "lecturer"].includes(saved.role) &&
          ["lessons", "questions", "saved", "agenda", "archived", "graph"].every((k) =>
            Array.isArray(saved[k as keyof DemoState]),
          ) &&
          saved.notes &&
          saved.materials
        )
          setData(saved);
      }
    } catch {
      notify("Data contoh tidak bisa dibaca. Ruang belajarmu dimuat ulang.", { kind: "warning" });
    }
    setReady(true);
  }, [notify]);
  useEffect(() => {
    if (!ready || liveMode) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      notify("Penyimpanan browser penuh. Perubahan tersedia sampai halaman ditutup.", {
        kind: "warning",
      });
    }
  }, [data, ready, notify]);
  const update = useCallback((fn: (state: DemoState) => DemoState) => setData(fn), []);
  return (
    <AppContext.Provider
      value={{
        data,
        ready,
        update,
        notify,
        reset: () => {
          setData(structuredClone(initialState));
          notify("Ruang demo direset.");
        },
      }}
    >
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && <Toast key={toast.id} toast={toast} onDone={clearToast} />}
      </div>
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw Error("AppProvider is required");
  return value;
}
