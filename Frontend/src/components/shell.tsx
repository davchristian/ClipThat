"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutGrid, BookOpen, Bookmark, CalendarDays, Settings2, Search, Bell, ChevronDown, Menu, ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "./provider";
import { Logo, Modal, CourseIcon } from "./ui";
import { courses, courseFor, type Role } from "@/lib/data";

const nav = [
  { href: "/", label: "Beranda", icon: LayoutGrid },
  { href: "/classes", label: "Mata kuliah", icon: BookOpen },
  { href: "/review", label: "Review saya", icon: Bookmark },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname(), { data, update } = useApp();
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState(""), [bell, setBell] = useState(false), [mobile, setMobile] = useState(false);
  const lecturer = data.role === "lecturer";
  const visibleCourses = lecturer ? courses.filter(c => c.id === "aljabar") : courses;
  const active = nav.find(n => n.href === "/" ? pathname === "/" : pathname.startsWith(n.href));
  const filtered = data.lessons.filter(s => (!lecturer || s.courseId === "aljabar") && (s.title + courseFor(s.courseId).name).toLowerCase().includes(query.toLowerCase()));
  const pending = data.agenda.filter(a => !a.confirmed).length;
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMobile(false); if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(v => !v); } }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, []);
  useEffect(() => { setMobile(false); }, [pathname]);
  return <div className="app-layout">
    <a className="skip-link" href="#main-content">Langsung ke isi</a>
    {mobile && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={() => setMobile(false)} />}
    <aside id="main-sidebar" className={"sidebar " + (mobile ? "is-open" : "")}>
      <Link href="/" aria-label="ClipThat beranda" className="brand-link"><Logo /></Link>
      <div className="workspace"><span className="workspace-mark">D</span><span className="sidebar-label">Ruang {lecturer ? "mengajar" : "belajarku"}</span><ChevronDown size={14} /></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav aria-label="Navigasi utama">{nav.filter(n => !lecturer || (n.href !== "/review" && n.href !== "/agenda")).map(n => {
        const selected = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
        return <Link key={n.href} href={n.href} className={"nav-item " + (selected ? "active" : "")} aria-current={selected ? "page" : undefined} title={n.label}><n.icon size={19} strokeWidth={1.7} /><span className="sidebar-label">{n.label}</span>{n.href === "/review" && data.saved.filter(s => !s.reviewed).length > 0 && <span className="nav-count">{data.saved.filter(s => !s.reviewed).length}</span>}</Link>;
      })}</nav>
      <div className="nav-caption course-caption">MATA KULIAH</div>
      <div className="sidebar-courses">{visibleCourses.map(c => <Link key={c.id} href={"/classes/" + c.id} className={"course-nav " + (pathname === "/classes/" + c.id ? "selected" : "")} title={c.name}><span className={"course-dot " + c.color} /><span className="sidebar-label">{c.name}</span></Link>)}</div>
      <div className="sidebar-bottom">
        <div className="quiet-note"><span className="little-sun">✳</span><p>Sedikit demi sedikit,<br />jadi lebih mengerti.</p></div>
        <Link className={"nav-item " + (pathname === "/settings" ? "active" : "")} href="/settings" title="Pengaturan"><Settings2 size={19} strokeWidth={1.7} /><span className="sidebar-label">Pengaturan</span></Link>
        <div className="profile"><div className="avatar">{lecturer ? "NP" : "DF"}</div><div className="profile-info"><strong>{lecturer ? "Nadia Putri" : "Davin Farel"}</strong><label className="role-select"><span className="sr-only">Pilih peran demo</span><select aria-label="Pilih peran demo" value={data.role} onChange={e => update(d => ({ ...d, role: e.target.value as Role }))}><option value="student">Mahasiswa</option><option value="lecturer">Dosen</option></select><ChevronDown size={12} /></label></div><span className="demo-label" title="Ruang demo dengan data contoh">DEMO</span></div>
      </div>
    </aside>
    <div className="main-wrapper">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Buka navigasi" aria-expanded={mobile} aria-controls="main-sidebar" onClick={() => setMobile(v => !v)}><Menu size={20} /></button><span>Workspace</span><span className="crumb-slash">/</span><strong>{active?.label || (pathname.startsWith("/session") ? "Ruang kelas" : "Pengaturan")}</strong></div><div className="topbar-actions"><button aria-label="Cari kelas atau topik" className="search-trigger" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Cari sesuatu…</span><kbd>Ctrl K</kbd></button><button className="notification-button icon-button" aria-label="Buka pemberitahuan" onClick={() => setBell(true)}><Bell size={19} />{pending > 0 && !lecturer && <span className="notification-dot" />}</button><div className="topbar-divider" /><span className="semester">Semester 3 <span className="status-dot" /></span></div></header>
      <main id="main-content" className="page-container" tabIndex={-1}>{children}</main>
      <footer className="app-footer"><span>Belajar ada ritmenya. Temukan punyamu.</span><span>Made for your learning moments <span>↗</span></span></footer>
    </div>
    <Modal open={searchOpen} title="Mau cari apa?" onClose={() => setSearchOpen(false)}>
      <div className="input-with-icon"><Search size={18} /><input autoFocus placeholder="Cari kelas atau topik…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Cari kelas atau topik" /></div>
      <div className="search-results">{filtered.map(s => <Link key={s.id} href={"/session/" + s.id} onClick={() => setSearchOpen(false)}><CourseIcon course={courseFor(s.courseId)} small /><span><strong>{s.title}</strong><small>{courseFor(s.courseId).name}</small></span><ArrowUpRight size={17} /></Link>)}{!filtered.length && <p className="muted py-8 text-center">Belum ketemu. Coba nama mata kuliahnya.</p>}</div>
    </Modal>
    <Modal open={bell} title="Kabar untukmu" onClose={() => setBell(false)}>
      <div className="notice-item"><span className="round-icon sage"><Sparkles size={20} /></span><div><strong>{lecturer ? "Pertanyaan kelas menunggu" : "Ada agenda dari kelas"}</strong><p>{lecturer ? "Bantu mahasiswa memahami materi hari ini." : "Tinjau dulu sebelum masuk ke agendamu."}</p><Link className="text-button" href={lecturer ? "/session/linear-05?tab=questions" : "/agenda"} onClick={() => setBell(false)}>{lecturer ? "Buka pertanyaan" : "Tinjau agenda"}<ArrowRight size={15} /></Link></div></div>
    </Modal>
  </div>;
}
