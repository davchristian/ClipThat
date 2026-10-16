"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { initialState } from "@/data";
import { readStoredState, writeStoredState } from "@/data/client-storage";
import type { DemoState } from "@/lib/types";
import type { Boot, BackendDetail } from "@/lib/backend-types";
import { api, RequestError } from "@/lib/api";
import { liveMode } from "@/lib/app-mode";
import { emptyLiveState, fromBoot, withDetail, persistChanges } from "./live-data";
type Context = {
  data: DemoState;
  ready: boolean;
  pending: boolean;
  error: string;
  update: (fn: (data: DemoState) => DemoState) => Promise<boolean>;
  run: (work: () => Promise<unknown>, message?: string) => Promise<boolean>;
  reload: () => Promise<void>;
  refreshSession: () => Promise<void>;
  notify: (message: string) => void;
  reset: () => void;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<DemoState>(liveMode ? emptyLiveState : initialState);
  const current = useRef(data);
  const queue = useRef(Promise.resolve());
  const loading = useRef(false);
  const sessionRefresh = useRef<{
    path: string;
    promise: Promise<void>;
    again: boolean;
  } | null>(null);
  const revision = useRef(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const notify = useCallback((text: string) => setToast({ text, id: Date.now() }), []);
  const commit = useCallback((next: DemoState) => {
    current.current = next;
    setData(next);
  }, []);
  const authPage = ["/login", "/register", "/onboarding"].includes(pathname);
  const load = useCallback(async () => {
    const version = ++revision.current;
    const boot = await api<Boot & { profile: { onboarded?: boolean } }>("boot");
    if (boot.profile.onboarded === false && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
    let next = fromBoot(boot, current.current);
    const id = /^\/session\/([^/]+)$/.exec(pathname)?.[1];
    if (id && next.lessons.some((s) => s.id === id)) {
      const detail = await api<BackendDetail>(`sessions/${id}`);
      next = withDetail(next, id, detail);
      if (next.role === "lecturer")
        next.confusion = { ...next.confusion, [id]: await api(`sessions/${id}/confusion`) };
    }
    if (window.location.pathname !== pathname || version !== revision.current) return;
    commit(next);
    setError("");
    setReady(true);
  }, [pathname, router, commit]);
  const reload = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      await load();
    } catch (e) {
      if (e instanceof RequestError && e.status === 401) {
        commit(emptyLiveState);
        router.replace("/login");
      } else setError(e instanceof Error ? e.message : "Koneksi terputus. Coba lagi.");
      setReady(true);
    } finally {
      loading.current = false;
    }
  }, [load, router, commit]);
  const refreshSession = useCallback((): Promise<void> => {
    const id = /^\/session\/([^/]+)$/.exec(pathname)?.[1];
    if (!id || !current.current.profile || !current.current.lessons.some((s) => s.id === id))
      return reload();
    if (sessionRefresh.current?.path === pathname) {
      sessionRefresh.current.again = true;
      return sessionRefresh.current.promise;
    }
    const refresh = { path: pathname, promise: Promise.resolve(), again: false };
    sessionRefresh.current = refresh;
    const promise = (async () => {
      do {
        refresh.again = false;
        const version = revision.current;
        try {
          const [detail, confusion] = await Promise.all([
            api<BackendDetail>(`sessions/${id}`),
            current.current.role === "lecturer"
              ? api<NonNullable<DemoState["confusion"]>[string]>(`sessions/${id}/confusion`)
              : Promise.resolve(undefined),
          ]);
          if (window.location.pathname !== pathname) return;
          if (version !== revision.current) {
            refresh.again = true;
            continue;
          }
          // A removed/archived session must be reconciled with the account's course list.
          if (detail.session.archived_at) return await reload();
          let next = withDetail(current.current, id, detail);
          if (confusion) next = { ...next, confusion: { ...next.confusion, [id]: confusion } };
          commit(next);
          setError("");
        } catch (e) {
          if (window.location.pathname !== pathname || version !== revision.current) return;
          if (e instanceof RequestError && e.status === 401) {
            commit(emptyLiveState);
            router.replace("/login");
          } else setError(e instanceof Error ? e.message : "Koneksi terputus. Coba lagi.");
        }
      } while (refresh.again && window.location.pathname === pathname);
      if (sessionRefresh.current === refresh) sessionRefresh.current = null;
    })();
    refresh.promise = promise.finally(() => {
      if (sessionRefresh.current === refresh) sessionRefresh.current = null;
    });
    return refresh.promise;
  }, [pathname, reload, router, commit]);
  useEffect(() => {
    if (liveMode) {
      if (!authPage) {
        setReady(false);
        loading.current = false;
        void reload();
      } else {
        commit(emptyLiveState);
        setReady(true);
      }
      return;
    }
    try {
      const saved = readStoredState();
      if (saved) commit(saved);
    } catch {
      notify("Data demo dimuat ulang.");
    }
    setReady(true);
  }, [authPage, pathname, reload, commit, notify]);
  useEffect(() => {
    if (liveMode || !ready) return;
    try {
      writeStoredState(data);
    } catch {
      notify("Penyimpanan browser penuh.");
    }
  }, [data, ready, notify]);
  useEffect(() => {
    if (!liveMode || authPage) return;
    const timer = setInterval(() => {
      if (!document.hidden && !pending) void refreshSession();
    }, 7000);
    const accountTimer = /^\/session\//.test(pathname)
      ? setInterval(() => {
          if (!document.hidden && !pending) void reload();
        }, 30000)
      : undefined;
    const visible = () => {
      if (!document.hidden) void refreshSession();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      clearInterval(accountTimer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [authPage, pathname, pending, reload, refreshSession]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const run = useCallback(
    (work: () => Promise<unknown>, message?: string): Promise<boolean> => {
      let result = false;
      const task = queue.current.then(async () => {
        setPending(true);
        revision.current++;
        try {
          await work();
          if (liveMode) await load();
          if (message) notify(message);
          result = true;
        } catch (e) {
          notify(e instanceof Error ? e.message : "Perubahan gagal disimpan.");
        } finally {
          setPending(false);
        }
      });
      queue.current = task.catch(() => {});
      return task.then(() => result);
    },
    [load, notify],
  );
  const update = useCallback(
    (fn: (state: DemoState) => DemoState): Promise<boolean> => {
      if (!liveMode) {
        commit(fn(current.current));
        return Promise.resolve(true);
      }
      return run(async () => {
        const before = current.current;
        await persistChanges(before, fn(before));
      });
    },
    [commit, run],
  );
  return (
    <AppContext.Provider
      value={{
        data,
        ready,
        pending,
        error,
        update,
        run,
        reload,
        refreshSession,
        notify,
        reset: () => {
          if (!liveMode) {
            commit(structuredClone(initialState));
            notify("Ruang demo direset.");
          }
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
