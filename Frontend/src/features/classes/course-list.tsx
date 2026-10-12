"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, ArrowLeft, CalendarClock, ChevronRight, RotateCcw, SearchX } from "lucide-react";
import { courses } from "@/lib/demo-data";
import { dateLabel } from "@/lib/format";
import type { Lesson } from "@/lib/types";
import { useApp } from "@/state/app-provider";
import { ActionMenu, CourseIcon, Empty, PageHeading, SectionTitle } from "@/components/ui";
import { SessionEntry } from "./session-entry";

export function CoursesView({ courseId }: { courseId?: string }) {
  const { data, update, notify } = useApp();
  const lecturer = data.role === "lecturer";
  const [showArchive, setShowArchive] = useState(false);
  const course = courses.find((c) => c.id === courseId);
  const visible = courses.filter((c) => !lecturer || c.id === "aljabar");
  if (courseId && (!course || (lecturer && course.id !== "aljabar")))
    return (
      <Empty
        icon={SearchX}
        title="Mata kuliah tidak tersedia"
        text="Tautannya mungkin sudah lama, atau mata kuliah ini tidak ada di daftar kelasmu."
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
  function archiveLesson(lesson: Lesson) {
    if (["live", "processing"].includes(lesson.status)) return;
    const index = data.lessons.findIndex((s) => s.id === lesson.id);
    update((d) => ({
      ...d,
      lessons: d.lessons.filter((s) => s.id !== lesson.id),
      archived: [...d.archived, { lesson, archivedAt: new Date().toISOString() }],
    }));
    notify("Sesi diarsipkan.", {
      action: {
        label: "Urungkan",
        run: () =>
          update((d) => {
            if (d.lessons.some((s) => s.id === lesson.id)) return d;
            const lessons = [...d.lessons];
            lessons.splice(Math.min(index, lessons.length), 0, lesson);
            return {
              ...d,
              lessons,
              archived: d.archived.filter((a) => a.lesson.id !== lesson.id),
            };
          }),
      },
    });
  }
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={16} />
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
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      )}
      <SectionTitle
        action={
          lecturer && (
            <button className="text-button" onClick={() => setShowArchive((v) => !v)}>
              <Archive size={16} />
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
                <button onClick={() => archiveLesson(s)}>
                  <Archive size={16} />
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
      {!lessons.length && (
        <Empty
          icon={CalendarClock}
          title="Belum ada pertemuan"
          text={
            lecturer
              ? "Buat sesi untuk mendapatkan kode kelas yang bisa dibagikan ke mahasiswa."
              : "Pertemuan muncul di sini begitu dosen membuat sesi kelas."
          }
        />
      )}
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
                    <RotateCcw size={16} />
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
    </>
  );
}
