"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, Paperclip, Image as ImageIcon, ArrowRight, LockKeyhole, Check } from "lucide-react";
import { useApp } from "./provider";
import { Empty, PageHeading } from "./ui";
import { SavedDetail } from "./saved-detail";
import { courseFor, seconds, type SavedItem } from "@/lib/data";
export function ReviewView() {
  const { data } = useApp(), [filter, setFilter] = useState("pending"), [selected, setSelected] = useState<SavedItem | null>(null);
  if (data.role === "lecturer") return <Empty title="Ruang ini milik mahasiswa" text="Rekap kelas tersedia tanpa membuka catatan personal mahasiswa." action={<Link href="/" className="button primary">Buka rekap kelas</Link>} />;
  const filtered = data.saved.filter(s => filter === "all" || (filter === "pending" ? !s.reviewed : s.reviewed));
  return <><PageHeading eyebrow="SESUAI RITMEMU" title="Pahami satu per satu." description="Momen yang kamu simpan. Waktu untuk mengerti." /><div className="chip-row">{[["pending", "Perlu diulang"], ["done", "Sudah paham"], ["all", "Semua"]].map(([id, text]) => <button key={id} className={"chip " + (filter === id ? "active" : "")} onClick={() => setFilter(id)}>{text} {id === "pending" ? "· " + data.saved.filter(s => !s.reviewed).length : ""}</button>)}</div>
    <div className="review-grid">{filtered.map(item => {
      const lesson = data.lessons.find(s => s.id === item.sessionId) || data.archived.find(s => s.lesson.id === item.sessionId)?.lesson;
      const course = courseFor(lesson?.courseId || "aljabar");
      const Icon = item.type === "capture" ? Paperclip : item.type === "photo" ? ImageIcon : Bookmark;
      return <article className={"saved-card " + (item.reviewed ? "reviewed" : "")} key={item.id}><div className="saved-card-top"><span className={"badge " + course.color}>{course.name}</span>{item.reviewed ? <Check size={16} /> : <Icon size={16} />}</div><h3>{item.title}</h3><p>{item.text.length > 120 ? item.text.slice(0, 120) + "…" : item.text}</p><div className="saved-card-footer"><span>{item.type === "capture" ? "Capture" : item.type === "photo" ? "Foto pribadi" : item.label} · {seconds(item.time)}</span><button className="text-button" onClick={() => setSelected(item)}>Buka<ArrowRight size={15} /></button></div></article>;
    })}</div>{!filtered.length && <Empty title={filter === "pending" ? "Sudah lebih paham." : "Belum ada di sini."} text={filter === "pending" ? "Semua bagian yang kamu tandai sudah direview. Nikmati jedanya." : "Tandai pembahasan saat kelas, lalu buka lagi saat kamu siap."} action={<Link className="button secondary" href="/classes">Lihat mata kuliah</Link>} />}
    <p className="privacy-note"><LockKeyhole size={13} />Catatan dan penanda ini hanya bisa kamu lihat.</p><SavedDetail item={selected} onClose={() => setSelected(null)} />
  </>;
}
