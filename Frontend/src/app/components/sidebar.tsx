"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronUp,
  Clock3,
  GraduationCap,
  House,
  Settings2,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import type { Role } from "@/lib/types";

const navigation = [
  { href: "/", label: "Home", icon: House },
  { href: "/classes", label: "Course", icon: GraduationCap },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];
const roles: { value: Role; label: string }[] = [
  { value: "student", label: "Mahasiswa" },
  { value: "lecturer", label: "Dosen" },
];
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

export function Sidebar({ mobile }: { mobile: boolean }) {
  const pathname = usePathname();
  const lecturer = useApp().data.role === "lecturer";

  return (
    <aside id="main-sidebar" className={`sidebar ${mobile ? "is-open" : ""}`}>
      <Link href="/" aria-label="ClipThat beranda" className="brand-link">
        <Logo />
      </Link>
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
              >
                <item.icon size={20} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
      <div className="sidebar-bottom">
        <Link className={`nav-item ${pathname === "/settings" ? "active" : ""}`} href="/settings">
          <Settings2 size={19} strokeWidth={1.7} />
          Pengaturan
        </Link>
        <SidebarClock />
        <div className="profile">
          <span className="avatar">{lecturer ? "NP" : "DF"}</span>
          <div className="profile-info">
            <strong>{lecturer ? "Nadia Putri" : "Davin Farel"}</strong>
            <RoleSwitcher />
          </div>
          <span className="demo-badge">Demo</span>
        </div>
      </div>
    </aside>
  );
}

function SidebarClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    <div className="sidebar-clock text-xs" aria-label="Waktu saat ini">
      <time dateTime={now?.toISOString()}>
        <span>{now ? dateFormatter.format(now) : ""}</span>
        <span>{now ? `${timeFormatter.format(now)} WIB` : ""}</span>
      </time>
    </div>
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
