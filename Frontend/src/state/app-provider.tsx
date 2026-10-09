"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { initialState } from "@/lib/demo-data";
import type { DemoState } from "@/lib/types";
type Context = {
  data: DemoState;
  ready: boolean;
  update: (fn: (data: DemoState) => DemoState) => void;
  notify: (message: string) => void;
  reset: () => void;
};
const AppContext = createContext<Context | null>(null);
const storageKey = "clipthat-frontend-v1";
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const notify = useCallback((text: string) => setToast({ text, id: Date.now() }), []);
  useEffect(() => {
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
      notify("Data contoh tidak bisa dibaca. Ruang belajarmu dimuat ulang.");
    }
    setReady(true);
  }, [notify]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      notify("Penyimpanan browser penuh. Perubahan tersedia sampai halaman ditutup.");
    }
  }, [data, ready, notify]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
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
        {toast && (
          <div className="toast">
            <span className="toast-check">✓</span>
            {toast.text}
            <button aria-label="Tutup pemberitahuan" onClick={() => setToast(null)}>
              ×
            </button>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw Error("AppProvider is required");
  return value;
}
