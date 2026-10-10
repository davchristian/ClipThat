import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseIcon } from "@/components/ui";
import type { Course, Lesson } from "@/lib/types";

export function CourseCard({ course, liveLesson }: { course: Course; liveLesson?: Lesson }) {
  return (
    <Link
      className={`home-course-row ${liveLesson ? "is-live" : ""}`}
      href={liveLesson ? `/session/${liveLesson.id}` : `/classes/${course.id}`}
      aria-label={
        liveLesson
          ? `Masuk kelas ${liveLesson.title} di ${course.name}`
          : `Buka course ${course.name}`
      }
    >
      <span className="home-course-top">
        <CourseIcon course={course} small />
        {liveLesson && (
          <span className="home-course-live">
            <span className="home-course-live-dot" /> Live
          </span>
        )}
      </span>
      <span className="home-course-copy">
        <strong>{course.name}</strong>
      </span>
      <span className="home-course-cta">
        {liveLesson ? "Masuk kelas" : "Buka course"} <ArrowRight size={14} />
      </span>
    </Link>
  );
}
