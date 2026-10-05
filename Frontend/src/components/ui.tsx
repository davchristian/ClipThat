"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, ArrowUpRight, Paperclip, BookOpen } from "lucide-react";
import type { Course } from "@/lib/data";

export function Logo() { return <span className="brand"><span className="brand-symbol"><Paperclip size={22} strokeWidth={2.5} /></span>clipthat<span className="brand-period">.</span></span>; }
export function CourseIcon({ course, small = false }: { course: Course; small?: boolean }) { return <span aria-hidden="true" className={"course-icon " + course.color + (small ? " small" : "")}>{course.glyph}</span>; }
export function Modal({ open, title, subtitle, onClose, children, wide = false }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), label = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    return () => { if (dialog?.open) dialog.close(); };
  }, [open]);
  return <dialog ref={ref} aria-labelledby={label} className={"modal " + (wide ? "wide" : "")} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-inner"><div className="modal-top"><div><h2 id={label}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Tutup dialog" onClick={onClose}><X size={20} /></button></div>{children}</div>
  </dialog>;
}
export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="empty"><div className="empty-icon"><BookOpen size={26} /></div><h3>{title}</h3><p>{text}</p>{action}</div>; }
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>; }
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) { return <div className="section-title"><h2>{children}</h2>{action}</div>; }
export function ArrowLink({ children }: { children: ReactNode }) { return <span className="arrow-link">{children}<ArrowUpRight size={15} /></span>; }
export function BookArt() {
  return <svg className="book-art" viewBox="0 0 250 200" fill="none" aria-hidden="true">
    <path d="M38 124 130 164 220 107 130 68Z" fill="#B7CFB3"/><path d="m38 124 2 12 90 42 90-58v-13l-90 57Z" fill="#DFE5CF"/>
    <path d="m45 115 78-51 92 31-85 57Z" fill="#F7F1DE"/><path d="m123 64 7 88" stroke="#D2D0B8" strokeWidth="2"/>
    <path d="m54 108 69-44 92 31-15-35-75-20-69 38Z" fill="#F4F0DF"/><path d="m125 40-2 24 7 88 3-31 67-44" stroke="#D7D6BD" strokeWidth="1.5"/>
    <path d="m165 49 12 3-4 37-7-7-9 3Z" fill="#DB876C"/><path d="m70 80 35-22m-32 32 34-22m32-6 22 6m-21 3 18 6" stroke="#C4C9AF" strokeWidth="2" strokeLinecap="round"/>
    <path d="M43 42v14m-7-7h14M207 133v12m-6-6h12" stroke="#AAC1A2" strokeWidth="2" strokeLinecap="round"/>
    <path d="M200 31c-20 2-23 14-22 26 14-2 24-11 22-26Z" fill="#91AC87"/><path d="m176 61 14-17" stroke="#C9D8BD" strokeWidth="2"/>
    <circle cx="55" cy="157" r="3" fill="#D5B975"/><circle cx="219" cy="65" r="3" fill="#D5B975"/>
  </svg>;
}
