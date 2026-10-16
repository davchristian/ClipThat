"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Check, ChevronUp, GraduationCap, House } from "lucide-react";
import { Logo } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import type { Role } from "@/lib/types";
import { liveMode } from "@/lib/app-mode";

const navigation = [
  { href: "/", label: "Home", icon: House },
  { href: "/classes", label: "Course", icon: GraduationCap },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];
const roles: { value: Role; label: string }[] = [
  { value: "student", label: "Mahasiswa" },
  { value: "lecturer", label: "Dosen" },
];

export function Sidebar({ mobile }: { mobile: boolean }) {
  const pathname = usePathname();
  const { data } = useApp();
  const lecturer = data.role === "lecturer";
  const name = data.profile?.name || (lecturer ? "Nadia Putri" : "Davin Farel");
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <aside id="main-sidebar" className={`sidebar ${mobile ? "is-open" : ""}`}>
      <div className="sidebar-header">
        <Link href="/" aria-label="ClipThat beranda" className="brand-link">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Navigasi utama">
        {navigation
          .filter((item) => !lecturer || item.href !== "/agenda")
          .map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/classes"
                  ? pathname.startsWith("/classes") || pathname.startsWith("/session")
                  : pathname.startsWith(item.href);
            return (
              <Link
                href={item.href}
                key={item.href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
              >
                <item.icon size={20} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
      <div className="sidebar-bottom">
        {liveMode ? (
          <Link
            href="/profile"
            className="profile sidebar-profile-avatar"
            aria-label={`Buka profil ${name}`}
            aria-current={pathname === "/profile" ? "page" : undefined}
          >
            <span className="avatar">{initials}</span>
            <div className="profile-info">
              <strong>{name}</strong>
              <small>{lecturer ? "Dosen" : "Mahasiswa"}</small>
            </div>
          </Link>
        ) : (
          <div className="profile">
            <Link
              href="/profile"
              className="sidebar-profile-avatar"
              aria-label={`Buka profil ${name}`}
            >
              <span className="avatar">{initials}</span>
            </Link>
            <div className="profile-info">
              <Link href="/profile">
                <strong>{name}</strong>
              </Link>
              <RoleSwitcher />
            </div>
            <span className="demo-badge">Demo</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function RoleSwitcher() {
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
        <ChevronUp size={12} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="role-options" role="group" aria-label="Pilihan peran demo">
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
              {data.role === role.value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
