"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Camera, LockKeyhole, Network, ScanLine } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { notesForLesson } from "@/data";
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
  const { data, update } = useApp();
  const lecturer = data.role === "lecturer";
  return (
    <section className="panel notes-panel">
      <p className="eyebrow">HASIL KELAS · UNTUK SEMUA PESERTA</p>
      <SectionTitle
        action={
          <button className="text-button" onClick={onSource}>
            Transkrip
            <ArrowRight size={14} />
          </button>
        }
      >
        Yang dipelajari hari ini
      </SectionTitle>
      <p className="notes-lead">
        Baca inti pembahasan, lalu lihat hubungannya dengan materi sebelumnya.
      </p>
      {notesForLesson(lesson).map((note, index) => (
        <details className="reading-note" key={note.title} open={index === 0}>
          <summary>{note.title}</summary>
          <p>{note.body}</p>
          {note.formula && <div className="formula">{note.formula}</div>}
        </details>
      ))}
      <div className="concept-preview">
        <span className="activity-icon">
          <Network size={18} />
        </span>
        <div>
          <strong>Peta konsep</strong>
          <p>
            {lesson.id === "linear-05"
              ? "Basis dan dimensi → representasi matriks → kernel dan image"
              : notesForLesson(lesson)
                  .map((note) => note.title)
                  .join(" → ")}
          </p>
        </div>
        <button className="text-button" onClick={onGraph}>
          Jelajahi <ArrowRight size={14} />
        </button>
      </div>
      {!lecturer ? (
        <>
          <div className="personal-results">
            <p className="eyebrow">PRIBADI · HANYA KAMU YANG MELIHAT</p>
            <h2>Bagianmu dari kelas ini</h2>
            <p>Penanda, capture, dan foto tetap terhubung ke waktu pembahasannya.</p>
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
              <p className="personal-empty">
                Belum ada bagian yang kamu simpan dari pertemuan ini.
              </p>
            )}
          </div>
          {lesson.id === "linear-05" && (
            <Link className="related-lesson" href="/session/basis-04">
              Ulangi: Basis dan dimensi
              <ArrowRight size={14} />
            </Link>
          )}
          {(lesson.status === "live" || data.notes[lesson.id]) && (
            <details className="detail-section personal-note">
              <summary>
                <LockKeyhole size={16} />
                Catatan pribadi
              </summary>
              {lesson.status === "live" ? (
                <>
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
                </>
              ) : (
                <p className="capture-excerpt">{data.notes[lesson.id]}</p>
              )}
            </details>
          )}
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
