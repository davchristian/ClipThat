"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { courses, courseFor } from "@/lib/demo-data";
import { CourseIcon, PageHeading, SectionTitle } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import { SessionEntry } from "./session-entry";

export function Dashboard() {
  const { data } = useApp();
  const lecturer = data.role === "lecturer";
  const lessons = data.lessons.filter((s) => !lecturer || s.courseId === "aljabar");
  const live = lessons.find((s) => s.status === "live");
  const next = live || lessons.find((s) => s.status === "upcoming");
  const visibleCourses = courses.filter((c) => !lecturer || c.id === "aljabar");
  return (
    <>
      <PageHeading title="Kelas" action={<SessionEntry create={lecturer} />} />
      {next && (
        <section className={`active-class ${live ? "is-live" : ""}`}>
          <div>
            <span className="live-label">
              <span className="status-dot" />
              {live ? "Sedang berlangsung" : `Berikutnya · ${next.time}`}
            </span>
            <h2>{next.title}</h2>
            <p>
              {courseFor(next.courseId).name} · Pertemuan {next.number}
            </p>
          </div>
          <Link href={`/session/${next.id}`} className={`button ${live ? "cream" : "primary"}`}>
            {lecturer ? "Buka kelas" : live ? "Masuk kelas" : "Lihat kelas"}
            <ArrowRight size={17} />
          </Link>
        </section>
      )}
      <SectionTitle>Mata kuliah</SectionTitle>
      <div className="course-grid">
        {visibleCourses.map((course) => {
          const session =
            lessons.find((s) => s.courseId === course.id && s.status === "live") ||
            lessons.find((s) => s.courseId === course.id && s.status === "upcoming") ||
            [...lessons].reverse().find((s) => s.courseId === course.id);
          return (
            <Link className="course-tile" href={`/classes/${course.id}`} key={course.id}>
              <CourseIcon course={course} />
              <div>
                <h3>{course.name}</h3>
                <p>{session?.title || "Belum ada pertemuan"}</p>
              </div>
              <ChevronRight size={17} />
            </Link>
          );
        })}
      </div>
    </>
  );
}
