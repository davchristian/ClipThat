"use client";

import {
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { BookOpen, MoreHorizontal, Paperclip, X, type LucideIcon } from "lucide-react";
import type { Course } from "@/lib/types";

export function Logo() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Paperclip size={20} />
      </span>
      clipthat<span className="brand-period">.</span>
    </span>
  );
}
export function CourseIcon({ course, small = false }: { course: Course; small?: boolean }) {
  return (
    <span aria-hidden="true" className={`course-icon ${course.color} ${small ? "small" : ""}`}>
      {course.glyph}
    </span>
  );
}
const phoneQuery = "(max-width: 620px)";
const sheetDismissMs = 260;
function rubberband(distance: number, dimension: number, constant = 0.55) {
  return (distance * dimension * constant) / (dimension + constant * distance);
}
function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  sheet = false,
  dismissible = true,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  sheet?: boolean;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  const dismissing = useRef(false);
  const drag = useRef<{ pointer: number; startY: number; samples: { y: number; t: number }[] }>(
    null,
  );
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) {
      dismissing.current = false;
      dialog?.classList.remove("is-dismissing");
      dialog?.style.removeProperty("transform");
      dialog?.showModal();
    }
    if (!open && dialog?.open) dialog.close();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);

  const isSheet = () => sheet && window.matchMedia(phoneQuery).matches;
  function requestClose() {
    if (!dismissible) return;
    const dialog = ref.current;
    if (!dialog || !isSheet()) return onClose();
    if (dismissing.current) return;
    dismissing.current = true;
    dialog.classList.add("is-dismissing");
    dialog.style.removeProperty("transition");
    dialog.style.transform = "translateY(100%)";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onClose, reduced ? 0 : sheetDismissMs);
  }
  function dragStart(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dismissible || !isSheet() || drag.current || dismissing.current) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointer: e.pointerId,
      startY: e.clientY,
      samples: [{ y: e.clientY, t: e.timeStamp }],
    };
    ref.current?.style.setProperty("transition", "none");
  }
  function dragMove(e: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    const dialog = ref.current;
    if (!current || !dialog || e.pointerId !== current.pointer) return;
    const distance = e.clientY - current.startY;
    const y = distance >= 0 ? distance : -rubberband(-distance, dialog.offsetHeight);
    dialog.style.transform = `translateY(${y}px)`;
    current.samples.push({ y: e.clientY, t: e.timeStamp });
    current.samples = current.samples.filter((s) => e.timeStamp - s.t <= 100);
  }
  function dragEnd(e: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const current = drag.current;
    const dialog = ref.current;
    if (!current || !dialog || e.pointerId !== current.pointer) return;
    drag.current = null;
    dialog.style.removeProperty("transition");
    const distance = Math.max(0, e.clientY - current.startY);
    const first = current.samples[0];
    const elapsed = e.timeStamp - first.t;
    const velocity = elapsed > 0 ? ((e.clientY - first.y) / elapsed) * 1000 : 0;
    const flicked = velocity > 400 && distance > 24;
    const projected = distance + project(Math.max(0, velocity));
    if (!cancelled && (flicked || projected > dialog.offsetHeight * 0.4)) requestClose();
    else dialog.style.removeProperty("transform");
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={label}
      className={`modal ${wide ? "wide" : ""} ${sheet ? "sheet" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="modal-inner">
        <div
          className={sheet ? "sheet-drag" : undefined}
          onPointerDown={sheet ? dragStart : undefined}
          onPointerMove={sheet ? dragMove : undefined}
          onPointerUp={sheet ? (e) => dragEnd(e) : undefined}
          onPointerCancel={sheet ? (e) => dragEnd(e, true) : undefined}
        >
          {sheet && <span className="sheet-handle" aria-hidden="true" />}
          <div className="modal-top">
            <div>
              <h2 id={label}>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button
              className="icon-button"
              aria-label="Tutup dialog"
              onClick={requestClose}
              disabled={!dismissible}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function ActionMenu({
  label = "Lainnya",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function close(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) ref.current?.removeAttribute("open");
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") ref.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details className="action-menu" ref={ref}>
      <summary className="icon-button" aria-label={label} title={label}>
        <MoreHorizontal size={20} />
      </summary>
      <div className="menu-items" onClick={() => ref.current?.removeAttribute("open")}>
        {children}
      </div>
    </details>
  );
}
export function Empty({
  title,
  text,
  action,
  icon: Icon = BookOpen,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="skeleton-page" role="status">
      <span className="skeleton" style={{ width: 112, height: 14 }} />
      <span className="skeleton" style={{ width: 256, height: 32 }} />
      <span className="skeleton skeleton-block" style={{ height: 224 }} />
      <span className="skeleton skeleton-block" style={{ height: 176 }} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
const noteShape = [
  ["38%", "100%", "94%", "62%"],
  ["30%", "100%", "88%"],
  ["34%", "97%", "100%", "46%"],
];
export function NotesSkeleton({ label }: { label: string }) {
  return (
    <div className="skeleton-notes processing" role="status">
      <p className="skeleton-label">{label}</p>
      {noteShape.map((widths, section) => (
        <div className="skeleton-section" key={section}>
          {widths.map((width, line) => (
            <span
              key={line}
              className={`skeleton ${line === 0 ? "skeleton-heading" : ""}`}
              style={{ width }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
export function PageHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {action}
    </div>
  );
}
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}
