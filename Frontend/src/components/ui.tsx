"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { BookOpen, MoreHorizontal, Paperclip, X } from "lucide-react";
import type { Course } from "@/lib/types";

export function Logo() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Paperclip size={21} />
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
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={label}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-top">
          <div>
            <h2 id={label}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" aria-label="Tutup dialog" onClick={onClose}>
            <X size={19} />
          </button>
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
        <MoreHorizontal size={21} />
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
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={24} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
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
