"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";
import { courses } from "@/lib/demo-data";
import { dateLabel } from "@/lib/format";
import type { Lesson } from "@/lib/types";
import { useApp } from "@/state/app-provider";
import { ActionMenu, CourseIcon, Empty, Modal, PageHeading, SectionTitle } from "@/components/ui";
import { SessionEntry } from "./session-entry";

export function CoursesView({ courseId }: { courseId?: string }) {
  const { data, update, notify } = useApp();
  const lecturer = data.role === "lecturer";
  const [archive, setArchive] = useState<Lesson | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const course = courses.find((c) => c.id === courseId);
  const visible = courses.filter((c) => !lecturer || c.id === "aljabar");
  if (courseId && (!course || (lecturer && course.id !== "aljabar")))
    return (
      <Empty
        title="Mata kuliah tidak tersedia"
        action={
          <Link className="button secondary" href="/">
            Kembali ke kelas
          </Link>
        }
      />
    );
  const lessons = data.lessons.filter(
    (s) => (!course || s.courseId === course.id) && (!lecturer || s.courseId === "aljabar"),
  );
  function archiveLesson() {
    if (!archive || ["live", "processing"].includes(archive.status)) return;
    update((d) => ({
      ...d,
      lessons: d.lessons.filter((s) => s.id !== archive.id),
      archived: [...d.archived, { lesson: archive, archivedAt: new Date().toISOString() }],
    }));
    setArchive(null);
    notify("Sesi diarsipkan.");
  }
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        Kelas
      </Link>
      <PageHeading
        title={course?.name || "Mata kuliah"}
        action={lecturer ? <SessionEntry create /> : undefined}
      />
      {!course && (
        <div className="course-grid mb-8">
          {visible.map((c) => (
            <Link className="course-tile" key={c.id} href={`/classes/${c.id}`}>
              <CourseIcon course={c} />
              <h3>{c.name}</h3>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      )}
      <SectionTitle
        action={
          lecturer && (
            <button className="text-button" onClick={() => setShowArchive((v) => !v)}>
              <Archive size={15} />
              {showArchive ? "Tutup arsip" : `Arsip (${data.archived.length})`}
            </button>
          )
        }
      >
        Pertemuan
      </SectionTitle>
      <div className="list-panel">
        {lessons.map((s) => (
          <div className="session-row" key={s.id}>
            <span className="session-number">{String(s.number).padStart(2, "0")}</span>
            <Link href={`/session/${s.id}`} className="row-main">
              <h3>{s.title}</h3>
              <p>
                {dateLabel(s.date)} · {s.time}
              </p>
            </Link>
            <span className={`badge ${s.status === "live" ? "live" : ""}`}>
              {s.status === "live"
                ? "Live"
                : s.status === "done"
                  ? "Selesai"
                  : s.status === "processing"
                    ? "Diproses"
                    : "Terjadwal"}
            </span>
            {lecturer && !["live", "processing"].includes(s.status) && (
              <ActionMenu label={`Opsi ${s.title}`}>
                <button onClick={() => setArchive(s)}>
                  <Archive size={15} />
                  Arsipkan {s.title}
                </button>
              </ActionMenu>
            )}
            <Link className="icon-button" aria-label={`Buka ${s.title}`} href={`/session/${s.id}`}>
              <ChevronRight size={18} />
            </Link>
          </div>
        ))}
      </div>
      {!lessons.length && <Empty title="Belum ada pertemuan" />}
      {showArchive && (
        <section className="panel mt-6">
          <SectionTitle>Arsip</SectionTitle>
          {data.archived.length ? (
            data.archived.map((item) => {
              const remaining = Math.max(
                0,
                30 - Math.floor((Date.now() - new Date(item.archivedAt).getTime()) / 86400000),
              );
              return (
                <div className="material-row" key={item.lesson.id}>
                  <Archive size={18} />
                  <span>
                    <strong>{item.lesson.title}</strong>
                    <small>
                      {remaining ? `${remaining} hari untuk memulihkan` : "Masa pemulihan berakhir"}
                    </small>
                  </span>
                  <button
                    className="button secondary small"
                    disabled={!remaining}
                    onClick={() => {
                      update((d) => ({
                        ...d,
                        lessons: [...d.lessons, item.lesson],
                        archived: d.archived.filter((a) => a.lesson.id !== item.lesson.id),
                      }));
                      notify("Sesi dipulihkan.");
                    }}
                  >
                    <RotateCcw size={14} />
                    Pulihkan
                  </button>
                </div>
              );
            })
          ) : (
            <p className="muted">Arsip kosong.</p>
          )}
        </section>
      )}
      <Modal
        open={!!archive}
        title="Arsipkan sesi?"
        subtitle={archive?.title}
        onClose={() => setArchive(null)}
      >
        <p className="muted">Bisa dipulihkan dalam 30 hari. Simpanan pribadi tetap ada.</p>
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setArchive(null)}>
            Batal
          </button>
          <button className="button danger" onClick={archiveLesson}>
            Arsipkan
          </button>
        </div>
      </Modal>
    </>
  );
}
