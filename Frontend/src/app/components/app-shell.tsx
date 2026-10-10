"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, Search } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { CourseIcon, Logo, Modal } from "@/components/ui";
import { courseFor } from "@/data";
import { Sidebar } from "./sidebar";
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobile(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    setMobile(false);
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
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
      <Sidebar mobile={mobile} />
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
