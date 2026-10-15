"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Camera, LockKeyhole, Network, ScanLine } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { useContent } from "@/data/use-content";
import { liveMode } from "@/lib/app-mode";
import { seconds } from "@/lib/format";
import type { Lesson, SavedItem } from "@/lib/types";
import { SectionTitle } from "@/components/ui";
export function NotesPanel({
  lesson,
  saved,
  onSource,
  onGraph,
  onSaved,
}: {
  lesson: Lesson;
  saved: SavedItem[];
  onSource: () => void;
  onGraph: () => void;
  onSaved: (id: string) => void;
}) {
  const { data, update, notify, pending } = useApp();
  const { notesForLesson } = useContent();
  const lecturer = data.role === "lecturer";
  const notes = notesForLesson(lesson);
  const [text, setText] = useState(data.notes[lesson.id] || "");
  useEffect(() => {
    setText(data.notes[lesson.id] || "");
  }, [lesson.id]);
  const review = data.reviews?.[lesson.id];
  return (
    <section className="panel notes-panel">
      <SectionTitle
        action={
          <button className="text-button" onClick={onSource}>
            Transkrip <ArrowRight size={14} />
          </button>
        }
      >
        Catatan kelas
      </SectionTitle>
      {notes.length ? (
        notes.map((note, i) => (
          <details className="reading-note" key={note.title} open={i === 0}>
            <summary>{note.title}</summary>
            <p>{note.body}</p>
            {note.formula && <div className="formula">{note.formula}</div>}
          </details>
        ))
      ) : (
        <p className="muted">Catatan otomatis tersedia setelah kelas selesai diproses.</p>
      )}
      <div className="concept-preview">
        <Network size={18} />
        <div>
          <strong>Peta konsep</strong>
          <p>Lihat hubungan antar subbab.</p>
        </div>
        <button className="text-button" onClick={onGraph}>
          Jelajahi <ArrowRight size={14} />
        </button>
      </div>
      {!lecturer ? (
        <>
          {review && (
            <details className="detail-section">
              <summary>Panduan review untukmu</summary>
              {review.sections.map((n) => (
                <div className="reading-note" key={n.title}>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </div>
              ))}
              {review.previous.map((p) => (
                <Link
                  className="related-lesson"
                  key={p.session_id}
                  href={`/session/${p.session_id}?tab=notes`}
                >
                  {p.reason}
                  <ArrowRight size={14} />
                </Link>
              ))}
            </details>
          )}
          <details className="detail-section personal-note">
            <summary>
              <LockKeyhole size={16} /> Catatan pribadi
            </summary>
            <label htmlFor="personal-note" className="sr-only">
              Catatan pribadimu
            </label>
            <textarea
              id="personal-note"
              placeholder="Tulis catatanmu…"
              maxLength={50000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="button secondary small"
              disabled={pending || text === (data.notes[lesson.id] || "")}
              onClick={async () => {
                if (await update((d) => ({ ...d, notes: { ...d.notes, [lesson.id]: text } })))
                  notify("Catatan pribadi tersimpan.");
              }}
            >
              Simpan catatan
            </button>
          </details>
          <div className="personal-results">
            <h2>Bagian tersimpan</h2>
            {saved.length ? (
              saved.map((s) => {
                const Icon =
                  s.type === "photo" ? Camera : s.type === "capture" ? ScanLine : Bookmark;
                return (
                  <button key={s.id} className="saved-preview" onClick={() => onSaved(s.id)}>
                    <Icon size={16} />
                    <strong>{s.title}</strong>
                    <small>{seconds(s.time)}</small>
                    <ArrowRight size={14} />
                  </button>
                );
              })
            ) : (
              <p className="muted">Belum ada bagian tersimpan.</p>
            )}
          </div>
        </>
      ) : (
        <details className="detail-section">
          <summary>Rekap kebingungan kelas</summary>
          {liveMode ? (
            data.confusion?.[lesson.id]?.length ? (
              data.confusion[lesson.id].map((c) => (
                <p key={c.start_seconds}>
                  {seconds(c.start_seconds)} ? {c.total} mahasiswa menandai bagian ini
                </p>
              ))
            ) : (
              <p className="muted">Belum ada penanda kebingungan.</p>
            )
          ) : (
            <p className="muted">Contoh agregat ? 8 mahasiswa menandai representasi matriks.</p>
          )}
        </details>
      )}
    </section>
  );
}
