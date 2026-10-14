"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  GraduationCap,
  LogIn,
  Menu,
  Search,
  Settings2,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import { CourseIcon, Logo, Modal } from "@/components/ui";
import { courseFor } from "@/lib/demo-data";
import { RoleSwitcher } from "./role-switcher";
import { liveMode } from "@/lib/app-mode";
import { LiveWorkspace } from "@/features/live/workspace";

const navigation = [
  { href: "/", label: "Kelas", icon: GraduationCap },
  { href: "/review", label: "Tersimpan", icon: Bookmark },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];
export function Shell({ children }: { children: ReactNode }) {
  return liveMode ? <LiveWorkspace>{children}</LiveWorkspace> : <DemoShell>{children}</DemoShell>;
}
function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const authPage = pathname === "/login" || pathname === "/register";
  const { data } = useApp();
  const mainRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const lecturer = data.role === "lecturer";
  const filtered = data.lessons.filter(
    (s) =>
      (!lecturer || s.courseId === "aljabar") &&
      (s.title + courseFor(s.courseId).name).toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (authPage) return;
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobile(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [authPage]);
  useEffect(() => {
    setMobile(false);
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  if (authPage) return <main className="auth-page">{children}</main>;
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Langsung ke isi
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Tutup navigasi"
          onClick={() => setMobile(false)}
        />
      )}
      <aside id="main-sidebar" className={`sidebar ${mobile ? "is-open" : ""}`}>
        <Link href="/" aria-label="ClipThat beranda" className="brand-link">
          <Logo />
        </Link>
        <button
          className="sidebar-search"
          aria-label="Cari kelas atau topik"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={17} />
          <span>Cari kelas</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav aria-label="Navigasi utama">
          {navigation
            .filter((n) => !lecturer || n.href === "/")
            .map((n) => {
              const active =
                n.href === "/"
                  ? pathname === "/" ||
                    pathname.startsWith("/classes") ||
                    pathname.startsWith("/session")
                  : pathname.startsWith(n.href);
              return (
                <Link
                  href={n.href}
                  key={n.href}
                  className={`nav-item ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <n.icon size={20} strokeWidth={1.7} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
        </nav>
        <div className="sidebar-bottom">
          <Link className={`nav-item ${pathname === "/settings" ? "active" : ""}`} href="/settings">
            <Settings2 size={19} strokeWidth={1.7} />
            Pengaturan
          </Link>
          <Link className="nav-item" href="/login">
            <LogIn size={19} strokeWidth={1.7} />
            Masuk
          </Link>
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
      <div className="main-wrapper" ref={mainRef}>
        <header className="mobile-topbar">
          <button
            className="icon-button"
            aria-label="Buka navigasi"
            aria-expanded={mobile}
            aria-controls="main-sidebar"
            onClick={() => setMobile((v) => !v)}
          >
            <Menu size={22} />
          </button>
          <Link href="/" aria-label="ClipThat">
            <Logo />
          </Link>
          <button
            className="icon-button"
            aria-label="Cari kelas atau topik"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={20} />
          </button>
        </header>
        <main id="main-content" className="page-container" tabIndex={-1}>
          {children}
        </main>
      </div>
      <Modal open={searchOpen} title="Cari kelas" onClose={() => setSearchOpen(false)}>
        <div className="input-with-icon">
          <Search size={18} />
          <input
            autoFocus
            aria-label="Cari kelas atau topik"
            placeholder="Kelas atau topik…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-results">
          {filtered.map((s) => (
            <Link key={s.id} href={`/session/${s.id}`} onClick={() => setSearchOpen(false)}>
              <CourseIcon course={courseFor(s.courseId)} small />
              <span>
                <strong>{s.title}</strong>
                <small>{courseFor(s.courseId).name}</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
          {!filtered.length && <p className="muted py-7 text-center">Tidak ditemukan.</p>}
        </div>
      </Modal>
    </div>
  );
}
