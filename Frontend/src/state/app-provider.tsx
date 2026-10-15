"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { initialState } from "@/data";
import { readStoredState, writeStoredState } from "@/data/client-storage";
import type { DemoState } from "@/lib/types";
import { confirmClassAgenda } from "@/lib/agenda";
type Context = {
  data: DemoState;
  ready: boolean;
  update: (fn: (data: DemoState) => DemoState) => void;
  notify: (message: string) => void;
  reset: () => void;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoState>(() => confirmClassAgenda(initialState));
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const notify = useCallback((text: string) => setToast({ text, id: Date.now() }), []);
  useEffect(() => {
    try {
      const saved = readStoredState();
      if (saved) setData(confirmClassAgenda(saved));
    } catch {
      notify("Data contoh tidak bisa dibaca. Ruang belajarmu dimuat ulang.");
    }
    setReady(true);
  }, [notify]);
  useEffect(() => {
    if (!ready) return;
    try {
      writeStoredState(data);
    } catch {
      notify("Penyimpanan browser penuh. Perubahan tersedia sampai halaman ditutup.");
    }
  }, [data, ready, notify]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const update = useCallback(
    (fn: (state: DemoState) => DemoState) => setData((state) => confirmClassAgenda(fn(state))),
    [],
  );
  return (
    <AppContext.Provider
      value={{
        data,
        ready,
        update,
        notify,
        reset: () => {
          setData(confirmClassAgenda(structuredClone(initialState)));
          notify("Ruang demo direset.");
        },
      }}
    >
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="toast" key={toast.id}>
            <span className="toast-check">✓</span>
            {toast.text}
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
