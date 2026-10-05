"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Trash2, Send, BookOpen } from "lucide-react";
import { useApp } from "./provider";
import { Modal } from "./ui";
import { seconds, type SavedItem } from "@/lib/data";
export function SavedDetail({ item, onClose }: { item: SavedItem | null; onClose: () => void }) {
  const { data, update, notify } = useApp(), [draft, setDraft] = useState<string | null>(null), [deleting, setDeleting] = useState(false);
  const exists = item && data.lessons.some(s => s.id === item.sessionId);
  const close = () => { setDraft(null); setDeleting(false); onClose(); };
  function remove() { if (!item) return; update(d => ({ ...d, saved: d.saved.filter(s => s.id !== item.id) })); notify("Bagian ini dihapus dari koleksimu."); close(); }
  function sendQuestion() {
    if (!item) return;
    const text = (draft ?? item.draft ?? "").trim(); if (!text) return;
    update(d => ({ ...d, questions: [{ id: crypto.randomUUID(), sessionId: item.sessionId, text, votes: 0, supported: false, time: seconds(item.time) }, ...d.questions] }));
    notify("Pertanyaan anonim terkirim ke kelas."); close();
  }
  return <Modal open={!!item} title={deleting ? "Hapus dari koleksimu?" : item?.title || "Bagian tersimpan"} subtitle={item && !deleting ? seconds(item.time) + (item.end ? " – " + seconds(item.end) : "") + " · Hanya untukmu" : undefined} onClose={close} wide={!deleting}>
    {item && (deleting ? <><p className="muted text-sm leading-7 mb-6">Capture, foto, atau penanda ini akan dihapus dari koleksi pribadimu. Materi kelas tetap tersedia.</p><div className="flex justify-end gap-2"><button className="button secondary" onClick={() => setDeleting(false)}>Batal</button><button className="button danger" onClick={remove}>Hapus</button></div></> : <>
      {item.image && <img src={item.image} alt={item.title} className="photo-preview" />}
      {item.summary ? <><p className="capture-excerpt">{item.summary}</p><details className="capture-source"><summary>Cuplikan transkrip · 90 detik</summary><p>{item.text}</p></details></> : <p className="capture-excerpt">{item.text}</p>}
      {item.type === "capture" && <div className="mt-6"><p className="eyebrow">PERTANYAAN YANG BISA KAMU AJUKAN</p><textarea aria-label="Draf pertanyaan capture" value={draft ?? item.draft ?? ""} onChange={e => setDraft(e.target.value)} maxLength={1000} /><div className="flex justify-end mt-3"><button className="button secondary small" disabled={!exists || !(draft ?? item.draft ?? "").trim()} onClick={sendQuestion}><Send size={14} />Kirim anonim</button></div></div>}
      <div className="flex flex-wrap gap-3 mt-7 items-center">{exists ? <Link href={"/session/" + item.sessionId + "?tab=transcript"} onClick={close} className="text-button"><BookOpen size={14} />Lihat pembahasan<ArrowRight size={14} /></Link> : <span className="muted text-xs">Sumber kelas diarsipkan. Salinan ini tetap tersimpan.</span>}<button className="button primary small ml-auto" onClick={() => { update(d => ({ ...d, saved: d.saved.map(s => s.id === item.id ? { ...s, reviewed: !s.reviewed } : s) })); notify(item.reviewed ? "Bagian dikembalikan ke daftar review." : "Satu hal lagi sudah kamu pahami."); close(); }}><Check size={14} />{item.reviewed ? "Review lagi" : "Sudah paham"}</button><button className="icon-button" aria-label="Hapus bagian pribadi" onClick={() => setDeleting(true)}><Trash2 size={16} /></button></div>
    </>)}
  </Modal>;
}
