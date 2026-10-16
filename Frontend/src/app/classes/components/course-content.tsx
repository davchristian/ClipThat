"use client";
import { liveMode } from "@/lib/app-mode";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowRight, Bookmark, Clock3, RotateCcw, UserRound } from "lucide-react";
import { demoNow } from "@/data";
import { useContent } from "@/data/use-content";
import type { Lesson } from "@/lib/types";
import { useApp } from "@/state/app-provider";
import { Breadcrumbs, CourseIcon, Empty, Modal, PageHeading, SectionTitle } from "@/components/ui";
import { SavedDetail } from "@/components/saved-detail";
import { CourseSessionCard } from "./course-session-card";
import { CourseOverview } from "./course-overview";
import { SessionEntry } from "./session-entry";
import { CourseEntry } from "./course-entry";
import { CourseCode } from "./course-code";
import { CourseJoin } from "./course-join";

export function CoursesView({ courseId }: { courseId?: string }) {
  const { courses } = useContent();
  const { data, update, notify, pending } = useApp();
  const lecturer = data.role === "lecturer";
  const router = useRouter();
  const [archive, setArchive] = useState<Lesson | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedSaved, setSelectedSaved] = useState<string | null>(null);
  const course = courses.find((c) => c.id === courseId);
  const visible = courses.filter((c) => liveMode || !lecturer || c.id === "aljabar");
  if (courseId && (!course || (!liveMode && lecturer && course.id !== "aljabar")))
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
    (s) =>
      (!course || s.courseId === course.id) && (liveMode || !lecturer || s.courseId === "aljabar"),
  );
  const currentLessons = lessons.filter((lesson) => lesson.status !== "done");
  const previousLessons = lessons
    .filter((lesson) => lesson.status === "done")
    .sort((a, b) => b.number - a.number);
  const courseLessons = [...data.lessons, ...data.archived.map((entry) => entry.lesson)];
  const courseSaved = course
    ? data.saved.filter((item) =>
        courseLessons.some(
          (lesson) => lesson.id === item.sessionId && lesson.courseId === course.id,
        ),
      )
    : [];
  const archivedPersonal = courseSaved.filter((item) =>
    data.archived.some((entry) => entry.lesson.id === item.sessionId),
  );
  async function archiveLesson() {
    if (!archive || ["live", "processing"].includes(archive.status)) return;
    const ok = await update((d) => ({
      ...d,
      lessons: d.lessons.filter((s) => s.id !== archive.id),
      archived: [...d.archived, { lesson: archive, archivedAt: new Date(demoNow).toISOString() }],
    }));
    if (!ok) return;
    setArchive(null);
    notify("Sesi diarsipkan.");
  }
  return (
    <>
      <Breadcrumbs
        items={
          course
            ? [{ label: "Course", href: "/classes" }, { label: course.name }]
            : [{ label: "Course" }]
        }
      />
      <PageHeading
        title={course?.name || "Course"}
        action={
          lecturer ? (
            course ? (
              <div className="course-heading-actions">
                <CourseCode code={course.joinCode} />
                <SessionEntry key={course.id} courseId={course.id} />
              </div>
            ) : (
              <CourseEntry />
            )
          ) : !course ? (
            <CourseJoin />
          ) : undefined
        }
      />
      {!course && (
        <div className="course-grid">
          {!visible.length && <p className="muted">Belum ada course.</p>}
          {visible.map((c) => (
            <Link
              className={`course-tile course-tile-${c.color}`}
              key={c.id}
              href={`/classes/${c.id}`}
            >
              <div className="course-tile-banner" aria-hidden="true">
                <span>{c.glyph}</span>
                <span>{c.glyph}</span>
                <span>{c.glyph}</span>
              </div>
              <div className="course-tile-info">
                <h3>{c.name}</h3>
                <div className="course-tile-meta" aria-label="Informasi mata kuliah">
                  <span className="course-tile-code">
                    <CourseIcon course={c} small /> {c.code}
                  </span>
                  <span>
                    <UserRound size={15} aria-hidden="true" /> {c.teacher}
                  </span>
                  <span className="course-tile-schedule">
                    <Clock3 size={15} aria-hidden="true" /> {c.days} · {c.scheduleTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {course && <CourseOverview course={course} lessons={lessons} agenda={data.agenda} />}
      {course && (
        <>
          {currentLessons.length > 0 && (
            <section className="course-session-section">
              <SectionTitle>
                {currentLessons.some((lesson) => lesson.status === "live")
                  ? "Kelas sedang berlangsung"
                  : "Pertemuan berikutnya"}
              </SectionTitle>
              <div className="course-session-list">
                {currentLessons.map((lesson) => (
                  <CourseSessionCard
                    lesson={lesson}
                    personal={data.saved.filter((item) => item.sessionId === lesson.id)}
                    questionCount={
                      data.questions.filter((item) => item.sessionId === lesson.id).length
                    }
                    lecturer={lecturer}
                    pending={pending}
                    onStart={async () => {
                      const ok = await update((d) => ({
                        ...d,
                        lessons: d.lessons.map((l) =>
                          l.id === lesson.id ? { ...l, status: "live" } : l,
                        ),
                      }));
                      if (ok) {
                        notify("Kelas dimulai.");
                        router.push(`/session/${lesson.id}?tab=transcript&record=1`);
                      }
                    }}
                    onArchive={() => setArchive(lesson)}
                    key={lesson.id}
                  />
                ))}
              </div>
            </section>
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
            Pertemuan sebelumnya
          </SectionTitle>
          <div className="course-session-list">
            {previousLessons.map((lesson) => (
              <CourseSessionCard
                lesson={lesson}
                personal={data.saved.filter((item) => item.sessionId === lesson.id)}
                questionCount={data.questions.filter((item) => item.sessionId === lesson.id).length}
                lecturer={lecturer}
                onArchive={() => setArchive(lesson)}
                key={lesson.id}
              />
            ))}
          </div>
          {!previousLessons.length && <Empty title="Belum ada pertemuan sebelumnya" />}
          {!lecturer && archivedPersonal.length > 0 && (
            <section className="archived-personal panel">
              <SectionTitle>Bagian pribadi dari sesi diarsipkan</SectionTitle>
              <p className="muted">
                Salinanmu tetap tersedia meski sumber kelasnya sudah diarsipkan.
              </p>
              {archivedPersonal.map((item) => (
                <button
                  className="saved-preview"
                  key={item.id}
                  onClick={() => setSelectedSaved(item.id)}
                >
                  <Bookmark size={16} />
                  <strong>{item.title}</strong>
                  <ArrowRight size={14} />
                </button>
              ))}
            </section>
          )}
        </>
      )}
      {showArchive && (
        <section className="panel mt-6">
          <SectionTitle>Arsip</SectionTitle>
          {data.archived.length ? (
            data.archived.map((item) => {
              const remaining = Math.max(
                0,
                30 -
                  Math.floor(
                    ((liveMode ? Date.now() : new Date(demoNow).getTime()) -
                      new Date(item.archivedAt).getTime()) /
                      86400000,
                  ),
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
                    disabled={!remaining || pending}
                    onClick={async () => {
                      const ok = await update((d) => ({
                        ...d,
                        lessons: [...d.lessons, item.lesson],
                        archived: d.archived.filter((a) => a.lesson.id !== item.lesson.id),
                      }));
                      if (ok) notify("Sesi dipulihkan.");
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
          <button className="button danger" disabled={pending} onClick={archiveLesson}>
            Arsipkan
          </button>
        </div>
      </Modal>
      <SavedDetail
        item={data.saved.find((item) => item.id === selectedSaved) || null}
        onClose={() => setSelectedSaved(null)}
      />
    </>
  );
}
