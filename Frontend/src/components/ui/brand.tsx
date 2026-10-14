import { Paperclip } from "lucide-react";
import type { Course } from "@/lib/types";

export function Logo() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Paperclip size={21} />
      </span>
      <span className="brand-name">
        clipthat<span className="brand-period">.</span>
      </span>
    </span>
  );
}

export function CourseIcon({ course, small = false }: { course: Course; small?: boolean }) {
  return (
    <span aria-hidden="true" className={`course-icon ${course.color} ${small ? "small" : ""}`}>
      {course.glyph}
    </span>
  );
}
