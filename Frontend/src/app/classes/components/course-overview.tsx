"use client";

import { liveMode } from "@/lib/app-mode";
import Link from "next/link";
import { ArrowRight, CalendarDays, Network } from "lucide-react";
import { demoToday } from "@/data";
import { useContent } from "@/data/use-content";
import { dateLabel } from "@/lib/format";
import type { Agenda, Course, Lesson } from "@/lib/types";

export function CourseOverview({
  course,
  lessons,
  agenda,
}: {
  course: Course;
  lessons: Lesson[];
  agenda: Agenda[];
}) {
  const { notesForLesson } = useContent();
  const completed = lessons
    .filter((lesson) => lesson.status === "done")
    .sort((a, b) => a.number - b.number);
  const active = lessons.find((lesson) => lesson.status === "live");
  const topics = completed.flatMap((lesson) => notesForLesson(lesson).map((note) => note.title));
  const nextAgenda = agenda
    .filter(
      (item) =>
        item.courseId === course.id &&
        item.confirmed &&
        !item.done &&
        item.date >=
          (liveMode
            ? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
            : demoToday),
    )
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];

  return (
    <>
      <div className="course-overview-grid">
        <section className="course-summary-panel">
          <div className="course-panel-heading">
            <h2>Rangkuman materi</h2>
            <span className="course-panel-count">{completed.length} pertemuan</span>
          </div>
          {completed.length ? (
            <>
              <div className="course-map-preview" aria-label="Pratinjau peta konsep">
                <Network size={17} />
                <div>
                  {topics.slice(0, 3).map((topic, index) => (
                    <span key={`${topic}-${index}`}>
                      {index > 0 && <ArrowRight size={13} aria-hidden="true" />}
                      <span>{topic}</span>
                    </span>
                  ))}
                  {topics.length > 3 && <small>+{topics.length - 3} materi lainnya</small>}
                  {active && (
                    <span className="course-map-current">
                      <ArrowRight size={13} aria-hidden="true" />
                      <span>{active.title} · sedang dibahas</span>
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="course-summary-lead">Belum ada rangkuman materi.</p>
          )}
          <Link
            className="text-button course-summary-action"
            href={`/classes/${course.id}/materials`}
          >
            Lihat materi <ArrowRight size={16} />
          </Link>
        </section>

        <section className="course-agenda-panel">
          <div className="course-panel-heading">
            <h2>Agenda terdekat</h2>
            <CalendarDays size={18} aria-hidden="true" />
          </div>
          {nextAgenda ? (
            <>
              <span className="course-agenda-kind">{nextAgenda.kind}</span>
              <h3>{nextAgenda.title}</h3>
              <p>
                {dateLabel(nextAgenda.date, true)} · {nextAgenda.time.replace(":", ".")}
              </p>
            </>
          ) : (
            <p className="course-agenda-empty">Belum ada agenda terdekat.</p>
          )}
          <Link className="text-button course-agenda-action" href="/agenda">
            Buka kalender <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
