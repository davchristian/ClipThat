"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronUp, LogOut } from "lucide-react";
import { useApp } from "@/state/app-provider";
import type { Role } from "@/lib/types";

const roles: { value: Role; label: string }[] = [
  { value: "student", label: "Mahasiswa" },
  { value: "lecturer", label: "Dosen" },
];

export function RoleSwitcher() {
  const { data, update } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);

  return (
    <div
      className="role-switcher"
      ref={ref}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="role-trigger"
        aria-label="Pilih peran demo"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {data.role === "lecturer" ? "Dosen" : "Mahasiswa"}
        <ChevronUp size={16} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="role-options">
          <div role="group" aria-label="Pilihan peran demo">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                aria-pressed={data.role === role.value}
                onClick={() => {
                  update((state) => ({ ...state, role: role.value }));
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                {role.label}
                {data.role === role.value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <Link className="role-signout" href="/login" onClick={() => setOpen(false)}>
            <LogOut size={16} aria-hidden="true" />
            Keluar
          </Link>
        </div>
      )}
    </div>
  );
}
