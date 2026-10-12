"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, LockKeyhole } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { notesForLesson } from "@/lib/demo-data";
import { seconds } from "@/lib/format";
import type { Lesson, SavedItem } from "@/lib/types";
import { SectionTitle } from "@/components/ui";

export function NotesPanel({
  lesson,
  saved,
  onSource,
  onSaved,
}: {
  lesson: Lesson;
  saved: SavedItem[];
  onSource: () => void;
  onSaved: (id: string) => void;
}) {
  const { data, update } = useApp();
  const lecturer = data.role === "lecturer";
  return (
    <section className="panel notes-panel">
      <SectionTitle
        action={
          <button className="text-button" onClick={onSource}>
            Transkrip
            <ArrowRight size={16} />
          </button>
        }
      >
        Ringkasan
      </SectionTitle>
      {notesForLesson(lesson).map((note, index) => (
        <details className="reading-note" key={note.title} open={index === 0}>
          <summary>{note.title}</summary>
          <p>{note.body}</p>
          {note.formula && <div className="formula">{note.formula}</div>}
        </details>
      ))}
      {!lecturer ? (
        <>
          {saved.length > 0 && (
            <details className="detail-section">
              <summary>
                <Bookmark size={16} />
                Bagian ditandai ({saved.length})
              </summary>
              {saved.map((s) => (
                <button key={s.id} className="saved-preview" onClick={() => onSaved(s.id)}>
                  <strong>{s.title}</strong>
                  <small>{seconds(s.time)}</small>
                  <ArrowRight size={16} />
                </button>
              ))}
            </details>
          )}
          {lesson.id === "linear-05" && (
            <Link className="related-lesson" href="/session/basis-04">
              Ulangi: Basis dan dimensi
              <ArrowRight size={16} />
            </Link>
          )}
          <details className="detail-section personal-note">
            <summary>
              <LockKeyhole size={16} />
              Catatan pribadi
            </summary>
            <label htmlFor="personal-note" className="sr-only">
              Catatan pribadimu
            </label>
            <textarea
              id="personal-note"
              placeholder="Tulis catatanmu…"
              maxLength={5000}
              value={data.notes[lesson.id] || ""}
              onChange={(e) =>
                update((d) => ({ ...d, notes: { ...d.notes, [lesson.id]: e.target.value } }))
              }
            />
          </details>
        </>
      ) : (
        <details className="detail-section">
          <summary>Rekap kelas</summary>
          <p className="field-hint">Contoh agregat · tanpa identitas</p>
          {["Representasi matriks", "Kernel", "Sifat linear"].map((s, i) => (
            <div className="aggregate-row" key={s}>
              <span>{s}</span>
              <div>
                <i style={{ width: `${[64, 38, 21][i]}%` }} />
              </div>
              <strong>{[64, 38, 21][i]}%</strong>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
