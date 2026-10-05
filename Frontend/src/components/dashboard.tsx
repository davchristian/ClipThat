"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Plus, Clock3, BookOpen, Check, Sun, ChevronRight, Users } from "lucide-react";
import { useApp } from "./provider";
import { BookArt, CourseIcon, Modal, PageHeading, SectionTitle } from "./ui";
import { courses, courseFor, dateLabel, type Lesson } from "@/lib/data";

export function SessionEntry({ create = false, children }: { create?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false), [error, setError] = useState(""), { data, update, notify } = useApp(), router = useRouter();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    if (create) {
      const title = String(form.get("title")).trim();
      if (!title) { setError("Isi topik kelasnya dulu."); return; }
      const id = "kelas-" + crypto.randomUUID().slice(0, 8);
      const number = Math.max(0, ...[...data.lessons, ...data.archived.map(a => a.lesson)].filter(s => s.courseId === "aljabar").map(s => s.number)) + 1;
      const lesson: Lesson = { id, title, courseId: "aljabar", number, date: String(form.get("date")), time: String(form.get("time")), status: "upcoming", code: "ALG" + id.slice(-5).toUpperCase(), duration: "90 menit" };
      update(d => ({ ...d, lessons: [...d.lessons, lesson] })); setOpen(false); notify("Sesi baru siap. Materi bisa ditambahkan dari ruang kelas."); router.push("/session/" + id);
    } else {
      const found = data.lessons.find(s => s.code.toLowerCase() === String(form.get("code")).trim().toLowerCase());
      if (!found) { setError("Kode belum ditemukan. Coba ALG05 untuk kelas contoh."); return; }
      setOpen(false); router.push("/session/" + found.id);
    }
  }
  return <><button className="button secondary" onClick={() => { setError(""); setOpen(true); }}><Plus size={17} />{children || (create ? "Buat sesi" : "Gabung kelas")}</button><Modal open={open} title={create ? "Siapkan kelas baru" : "Masuk ke kelasmu"} subtitle={create ? "Mulai dari topiknya. Materi bisa menyusul." : "Masukkan kode yang dibagikan dosen."} onClose={() => setOpen(false)}><form onSubmit={submit} className="form-stack">{create ? <><label>Topik pertemuan<input name="title" placeholder="Contoh: Nilai eigen" maxLength={90} required autoFocus /></label><label>Mata kuliah<input value="Aljabar Linear" readOnly /></label><div className="form-row"><label>Tanggal<input type="date" name="date" defaultValue="2026-10-08" required /></label><label>Waktu<input type="time" name="time" defaultValue="09:00" required /></label></div></> : <><label>Kode kelas<input name="code" placeholder="ALG05" className="code-input" autoComplete="off" maxLength={12} autoFocus required /></label><p className="field-hint">Coba kode <strong>ALG05</strong> di ruang demo ini.</p></>}{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary w-full" type="submit">{create ? "Buat sesi kelas" : "Gabung kelas"}<ArrowRight size={17} /></button></form></Modal></>;
}
export function Dashboard() {
  const { data, update } = useApp(), lecturer = data.role === "lecturer";
  const lessons = data.lessons.filter(s => !lecturer || s.courseId === "aljabar");
  const live = lessons.find(s => s.status === "live"), hero = live || lessons.find(s => s.status === "upcoming");
  const recent = lessons.filter(s => s.status === "done").slice(0, 3);
  const todos = data.agenda.filter(a => a.confirmed && !a.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const reviewCount = data.saved.filter(s => !s.reviewed).length;
  return <>
    <PageHeading eyebrow="SENIN, 5 OKTOBER 2026" title={lecturer ? "Selamat pagi, Bu Nadia" : "Hai, Davin"} description={lecturer ? "Ruang untuk berbagi, waktu untuk memahami." : "Senang melihatmu lagi. Mau mulai dari mana?"} action={<SessionEntry create={lecturer} />} />
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <section className="live-card">
          <div className="live-card-copy"><div className="live-pill"><span className={live ? "live-dot" : "status-dot"} />{live ? "Kelas sedang berlangsung" : hero ? "Kelas berikutnya" : "Ruang belajarmu"}</div>
            <h2>{hero ? courseFor(hero.courseId).name : "Waktu untuk mengulang."}</h2><p>{hero ? hero.title + " · Pertemuan " + hero.number : "Buka lagi hal yang ingin kamu pahami."}</p>
            <div className="live-card-footer"><Link className="button cream" href={hero ? "/session/" + hero.id : lecturer ? "/classes" : "/review"}>{hero ? lecturer ? "Buka ruang kelas" : "Masuk kelas" : lecturer ? "Lihat pertemuan" : "Buka review"}<ArrowRight size={17} /></Link><span><Clock3 size={14} />{hero ? hero.time + " – " + (hero.time === "09:00" ? "10:30" : "14:40") : "Sesuai ritmemu"}</span></div>
          </div><BookArt /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        </section>
        <section className="recent-section">
          <SectionTitle action={<Link href="/classes" className="text-button">Lihat semua<ArrowUpRight size={15} /></Link>}>{lecturer ? "Pertemuan terakhir" : "Lanjut dari terakhir"}</SectionTitle>
          <div className="recent-list">{recent.map(s => <Link className="recent-row" href={"/session/" + s.id} key={s.id}><CourseIcon course={courseFor(s.courseId)} /><div className="recent-row-info"><strong>{s.title}</strong><p>{courseFor(s.courseId).name}<span>·</span>Pertemuan {s.number}</p></div><div className="recent-row-end"><span className="note-ready"><Check size={12} />Catatan siap</span><small>{dateLabel(s.date)}</small></div><ChevronRight size={17} className="muted" /></Link>)}
          {!recent.length && <p className="muted py-8">Catatan akan muncul setelah kelas selesai.</p>}</div>
        </section>
        {lecturer && <section className="lecture-summary"><SectionTitle>Yang perlu dibahas lagi</SectionTitle><p className="muted text-sm">Rekap contoh kelas, tanpa catatan personal mahasiswa.</p>{[["Representasi matriks", 64], ["Kernel dan image", 38], ["Sifat linear", 21]].map(([name, value]) => <div className="aggregate-row" key={name}><span>{name}</span><div><i style={{ width: value + "%" }} /></div><strong>{value}%</strong></div>)}</section>}
      </div>
      <aside className="dashboard-aside">
        <section className="agenda-preview"><SectionTitle action={<Link aria-label={lecturer ? "Lihat pertanyaan" : "Buka agenda"} href={lecturer ? "/session/linear-05?tab=questions" : "/agenda"} className="icon-button"><ArrowUpRight size={17} /></Link>}>{lecturer ? "Kelas hari ini" : "Dalam waktu dekat"}</SectionTitle>
          <div className="mini-week">{["S", "S", "R", "K", "J", "S", "M"].map((day, i) => <div key={i} className={i === 0 ? "today" : ""}><span>{day}</span><strong>{5 + i}</strong>{[0, 2, 3].includes(i) && <i />}</div>)}</div>
          <div className="upcoming-items">{lecturer ? lessons.filter(s => s.status !== "done").slice(0, 3).map(s => <Link href={"/session/" + s.id} className="upcoming-item" key={s.id}><span className="event-line sage" /><div><small>{s.time} · {s.status === "live" ? "Berlangsung" : dateLabel(s.date)}</small><strong>{s.title}</strong></div><ChevronRight size={15} /></Link>) : todos.map(a => <div className="upcoming-item" key={a.id}><span className={"event-line " + courseFor(a.courseId).color} /><Link href="/agenda"><small>{dateLabel(a.date)} · {a.time}</small><strong>{a.title}</strong><span className="muted text-xs">{courseFor(a.courseId).name}</span></Link><button className="task-check" aria-label={"Selesaikan " + a.title} onClick={() => update(d => ({ ...d, agenda: d.agenda.map(item => item.id === a.id ? { ...item, done: true } : item) }))}><Check size={13} /></button></div>)}</div>
          {!lecturer && data.agenda.some(a => !a.confirmed) && <Link href="/agenda" className="new-agenda"><span className="tiny-dot" />Ada {data.agenda.filter(a => !a.confirmed).length} agenda untuk ditinjau<ChevronRight size={15} /></Link>}
        </section>
        <Link href={lecturer ? "/session/linear-05?tab=questions" : "/review"} className="review-nudge"><div className="nudge-top"><span className="nudge-icon">{lecturer ? <Users size={20} /> : <Sun size={22} />}</span><ArrowUpRight size={19} /></div><h3>{lecturer ? "Sedikit jawaban, banyak arti." : "Sebentar juga berarti."}</h3><p>{lecturer ? data.questions.filter(q => !q.answer && !q.oral).length + " pertanyaan menunggu jawabanmu." : reviewCount + " bagian tersimpan. Pahami satu dulu?"}</p><span className="nudge-link">{lecturer ? "Buka pertanyaan" : "Mulai review"}<ArrowRight size={15} /></span></Link>
      </aside>
    </div>
    <section className="course-section"><SectionTitle action={<Link href="/classes" className="text-button">Semua mata kuliah<ArrowUpRight size={15} /></Link>}>{lecturer ? "Mata kuliah yang kamu ajar" : "Ruang belajarmu"}</SectionTitle><div className="course-card-grid">{(lecturer ? courses.filter(c => c.id === "aljabar") : courses.slice(0, 3)).map(c => <Link href={"/classes/" + c.id} className={"course-card " + c.color} key={c.id}><div className="course-card-top"><CourseIcon course={c} /><span className="course-code">{c.code}</span><ArrowUpRight size={18} /></div><h3>{c.name}</h3><p>{c.teacher}</p><div className="course-card-bottom"><span><BookOpen size={14} />{data.lessons.filter(s => s.courseId === c.id).length} pertemuan</span><span>{c.days}</span></div><div className="course-card-art" aria-hidden="true">{c.id === "aljabar" ? "↗" : c.id === "algoritma" ? "⌘" : "∿"}</div></Link>)}</div></section>
    <div className="bottom-note"><span className="tiny-spark">✳</span>Semua hal besar dimulai dari satu hal yang dipahami.</div>
  </>;
}
