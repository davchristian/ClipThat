import Link from "next/link";
import { Archive, ArrowRight, Bookmark, FileText, MessageCircle, Play } from "lucide-react";
import { ActionMenu } from "@/components/ui";
import { dateLabel } from "@/lib/format";
import type { Lesson, SavedItem } from "@/lib/types";

export function CourseSessionCard({
  lesson,
  personal,
  lecturer,
  questionCount,
  onArchive,
  onStart,
  pending,
}: {
  lesson: Lesson;
  personal: SavedItem[];
  lecturer: boolean;
  questionCount: number;
  onArchive: () => void;
  onStart?: () => void;
  pending?: boolean;
}) {
  return (
    <article className={`course-session-card ${lesson.status === "live" ? "is-live" : ""}`}>
      <div className="course-session-top">
        <span className="session-number">{String(lesson.number).padStart(2, "0")}</span>
        <div className="row-main">
          <span className="eyebrow">
            {dateLabel(lesson.date)} · {lesson.time}
          </span>
          <h3>{lesson.title}</h3>
        </div>
        <span className={`badge ${lesson.status === "live" ? "live" : ""}`}>
          {lesson.status === "live"
            ? "Live"
            : lesson.status === "done"
              ? "Rangkuman siap"
              : lesson.status === "processing"
                ? "Diproses"
                : "Terjadwal"}
        </span>
        {lecturer && !["live", "processing"].includes(lesson.status) && (
          <ActionMenu label={`Opsi ${lesson.title}`}>
            <button onClick={onArchive}>
              <Archive size={15} />
              Arsipkan {lesson.title}
            </button>
          </ActionMenu>
        )}
      </div>
      {lesson.status === "done" && (
        <div className="course-session-resources">
          <Link href={`/session/${lesson.id}?tab=transcript`}>
            <FileText size={16} />
            Transkrip mentah
          </Link>
          <Link href={`/session/${lesson.id}?tab=notes`}>
            <Bookmark size={16} />
            {personal.length} bagian ditandai
          </Link>
          <Link href={`/session/${lesson.id}?tab=questions`}>
            <MessageCircle size={16} />
            {questionCount} pertanyaan kelas
          </Link>
        </div>
      )}
      <div className="course-session-actions">
        {lecturer && lesson.status === "upcoming" && onStart && (
          <button className="button primary small" disabled={pending} onClick={onStart}>
            <Play size={14} />
            Mulai kelas
          </button>
        )}
        <Link
          className="text-button"
          href={`/session/${lesson.id}?tab=${lesson.status === "done" ? "notes" : "transcript"}`}
        >
          {lesson.status === "done"
            ? "Buka rangkuman kelas"
            : lesson.status === "live"
              ? "Masuk kelas"
              : "Buka pertemuan"}
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
