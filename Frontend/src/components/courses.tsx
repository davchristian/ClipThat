"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, BookOpen, Search, Archive, RotateCcw } from "lucide-react";
import { courses, courseFor, dateLabel, type Lesson } from "@/lib/data";
import { useApp } from "./provider";
import { CourseIcon, Empty, Modal, PageHeading, SectionTitle } from "./ui";
import { SessionEntry } from "./dashboard";

export function CoursesView({ courseId }: { courseId?: string }) {
  const { data, update, notify } = useApp(), lecturer = data.role === "lecturer";
  const [query, setQuery] = useState(""), [archive, setArchive] = useState<Lesson | null>(null), [showArchive, setShowArchive] = useState(false);
  const course = courses.find(c => c.id === courseId);
  const visible = (lecturer ? courses.filter(c => c.id === "aljabar") : courses).filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  if (courseId && (!course || (lecturer && course.id !== "aljabar"))) return <Empty title="Mata kuliah tidak tersedia" text="Pilih mata kuliah dari ruang belajarmu." action={<Link href="/classes" className="button primary">Kembali</Link>} />;
  function archiveLesson() {
    if (!archive || (archive.status === "live" || archive.status === "processing")) return;
    update(d => ({ ...d, lessons: d.lessons.filter(s => s.id !== archive.id), archived: [...d.archived, { lesson: archive, archivedAt: new Date().toISOString() }] }));
    notify("Sesi diarsipkan. Salinan pribadi mahasiswa tetap tersedia."); setArchive(null);
  }
  return <>
    {course ? <><Link href="/classes" className="back-link"><ArrowLeft size={14} />Mata kuliah</Link><div className={"course-detail-hero " + course.color}><CourseIcon course={course} /><div><p className="eyebrow">{course.code} · SEMESTER 3</p><h1>{course.name}</h1><p>{course.teacher} · {course.days}</p></div>{lecturer && <SessionEntry create />}</div></> : <PageHeading eyebrow="RUANG BELAJARMU" title={lecturer ? "Mata kuliah" : "Satu tempat, semua kelas."} description={lecturer ? "Kelola pertemuan dan materi kelasmu." : "Materi, catatan, dan momen yang kamu simpan."} action={<SessionEntry create={lecturer} />} />}
    {!course && <><div className="input-with-icon mb-7 max-w-sm"><Search size={17} /><input placeholder="Cari mata kuliah…" aria-label="Cari mata kuliah" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="course-card-grid mb-10">{visible.map(c => <Link className={"course-card " + c.color} key={c.id} href={"/classes/" + c.id}><div className="course-card-top"><CourseIcon course={c} /><span className="course-code">{c.code}</span><ArrowUpRight size={18} /></div><h3>{c.name}</h3><p>{c.teacher}</p><div className="course-card-bottom"><span><BookOpen size={14} />{data.lessons.filter(s => s.courseId === c.id).length} pertemuan</span><span>{c.days}</span></div></Link>)}</div>{!visible.length && <Empty title="Belum ketemu" text="Coba cari dengan nama mata kuliah yang lain." />}</>}
    <SectionTitle action={lecturer && <button className="text-button" onClick={() => setShowArchive(v => !v)}><Archive size={14} />{showArchive ? "Tutup arsip" : "Arsip (" + data.archived.length + ")"}</button>}>{course ? "Semua pertemuan" : "Pertemuanmu"}</SectionTitle>
    <div className="session-list">{data.lessons.filter(s => (!course || s.courseId === course.id) && (!lecturer || s.courseId === "aljabar")).map(s => <div className="session-row" key={s.id}><span className="session-number">{String(s.number).padStart(2, "0")}</span><Link href={"/session/" + s.id} className="session-row-main"><h3>{s.title}</h3><p>{dateLabel(s.date, true)} · {s.time} · {courseFor(s.courseId).name}</p></Link><span className={"badge " + (s.status === "live" ? "live" : s.status === "upcoming" ? "peach" : "")}>{s.status === "live" ? "Berlangsung" : s.status === "done" ? "Catatan siap" : s.status === "processing" ? "Diproses" : "Terjadwal"}</span>{lecturer && s.status !== "live" && s.status !== "processing" && <button className="icon-button" aria-label={"Arsipkan " + s.title} onClick={() => setArchive(s)}><Archive size={15} /></button>}<Link href={"/session/" + s.id} className="icon-button" aria-label={"Buka " + s.title}><ChevronRight size={17} /></Link></div>)}</div>
    {course && !data.lessons.some(s => s.courseId === course.id) && <Empty title="Pertemuan pertama segera hadir" text="Sesi dan materi akan muncul di sini." />}
    {showArchive && <section className="panel mt-6"><SectionTitle>Arsip kelas</SectionTitle>{data.archived.length ? data.archived.map(item => {
      const remaining = Math.max(0, 30 - Math.floor((Date.now() - new Date(item.archivedAt).getTime()) / 86400000));
      return <div className="material-row" key={item.lesson.id}><Archive size={18} className="muted" /><span><strong>{item.lesson.title}</strong><small>{remaining ? "Bisa dipulihkan selama " + remaining + " hari lagi" : "Masa pemulihan berakhir"}</small></span><button className="button secondary small" disabled={!remaining} onClick={() => { update(d => ({ ...d, lessons: [...d.lessons, item.lesson], archived: d.archived.filter(a => a.lesson.id !== item.lesson.id) })); notify("Sesi dipulihkan."); }}><RotateCcw size={14} />Pulihkan</button></div>;
    }) : <p className="muted text-sm py-5">Belum ada sesi yang diarsipkan.</p>}</section>}
    <Modal open={!!archive} title="Arsipkan pertemuan ini?" subtitle={archive?.title} onClose={() => setArchive(null)}><p className="muted text-sm leading-7 mb-6">Materi bersama tidak akan terlihat oleh peserta. Salinan capture dan catatan pribadi mereka tetap tersimpan. Sesi bisa dipulihkan dalam 30 hari.</p><div className="flex justify-end gap-2"><button className="button secondary" onClick={() => setArchive(null)}>Batal</button><button className="button danger" onClick={archiveLesson}><Archive size={15} />Arsipkan</button></div></Modal>
  </>;
}
