"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

export type ToastKind = "success" | "info" | "warning" | "error";
export type ToastOptions = {
  kind?: ToastKind;
  action?: { label: string; run: () => void };
};
export type ToastData = ToastOptions & { text: string; id: number; kind: ToastKind };

const icons = { success: CircleCheck, info: Info, warning: TriangleAlert, error: CircleAlert };
const durations = { success: 4000, info: 4000, warning: 7000, error: 7000 };
const exitDuration = 150;

export function Toast({ toast, onDone }: { toast: ToastData; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef(toast.action ? 6000 : durations[toast.kind]);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const holds = useRef(0);
  const Icon = icons[toast.kind];

  const leave = useCallback(() => setLeaving(true), []);
  const resume = useCallback(() => {
    startedAt.current = Date.now();
    timer.current = window.setTimeout(leave, remaining.current);
  }, [leave]);
  const pause = useCallback(() => {
    window.clearTimeout(timer.current);
    remaining.current -= Date.now() - startedAt.current;
  }, []);
  const hold = () => {
    if (holds.current++ === 0) pause();
  };
  const release = () => {
    if (holds.current > 0 && --holds.current === 0) resume();
  };
  const focusMovedWithin = (e: FocusEvent<HTMLDivElement>) =>
    e.currentTarget.contains(e.relatedTarget as Node | null);

  useEffect(() => {
    resume();
    return () => window.clearTimeout(timer.current);
  }, [resume]);
  useEffect(() => {
    if (!leaving) return;
    window.clearTimeout(timer.current);
    const done = window.setTimeout(onDone, exitDuration);
    return () => window.clearTimeout(done);
  }, [leaving, onDone]);

  return (
    <div
      className="toast"
      data-kind={toast.kind}
      data-leaving={leaving || undefined}
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocus={(e) => !focusMovedWithin(e) && hold()}
      onBlur={(e) => !focusMovedWithin(e) && release()}
    >
      <Icon className="toast-icon" size={18} aria-hidden="true" />
      <span className="toast-text">{toast.text}</span>
      {toast.action && (
        <button
          className="toast-action"
          onClick={() => {
            toast.action?.run();
            leave();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="toast-close" aria-label="Tutup pemberitahuan" onClick={leave}>
        <X size={16} />
      </button>
    </div>
  );
}
