"use client";
import { liveMode } from "@/lib/app-mode";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { GraphExplorer } from "@/features/graph/graph-explorer";
import { graphForLesson, mergeGraphs } from "@/features/graph/graph-data";
import { useContent } from "@/data/use-content";
import { Breadcrumbs, Empty, PageHeading, SectionTitle } from "@/components/ui";
import { useApp } from "@/state/app-provider";

export function CourseMaterials({ courseId }: { courseId: string }) {
  const { courses, notesForLesson } = useContent();
  const { data } = useApp();
  const router = useRouter();
  const course = courses.find((item) => item.id === courseId);
  if (!course || (!liveMode && data.role === "lecturer" && course.id !== "aljabar")) {
    return (
      <Empty
        title="Mata kuliah tidak tersedia"
        action={
          <Link className="button secondary" href="/classes">
            Kembali ke course
          </Link>
        }
      />
    );
  }
  const lessons = data.lessons.filter((lesson) => lesson.courseId === course.id);
  const completed = lessons
    .filter((lesson) => lesson.status === "done")
    .sort((a, b) => a.number - b.number);
  const active = lessons.find((lesson) => lesson.status === "live");
  const topics = completed.flatMap((lesson) => notesForLesson(lesson).map((note) => note.title));

  return (
    <div className="course-materials-page">
      <Breadcrumbs
        items={[
          { label: "Course", href: "/classes" },
          { label: course.name, href: `/classes/${course.id}` },
          { label: "Materi" },
        ]}
      />
      <PageHeading title={`Materi ${course.name}`} />
      {completed.length ? (
        <>
          <section className="course-materials-map panel">
            <SectionTitle>Peta konsep</SectionTitle>
            <GraphExplorer
              graph={mergeGraphs(
                completed.map((lesson) => ({
                  sessionId: lesson.id,
                  graph: graphForLesson(
                    lesson,
                    notesForLesson(lesson),
                    data.conceptGraphs?.[lesson.id],
                  ),
                })),
              )}
              onSource={(id, source, sourceSession) => {
                const node = mergeGraphs(
                  completed.map((lesson) => ({
                    sessionId: lesson.id,
                    graph: graphForLesson(
                      lesson,
                      notesForLesson(lesson),
                      data.conceptGraphs?.[lesson.id],
                    ),
                  })),
                ).nodes.find((n) => n.id === id);
                if (sourceSession || node?.sessionId)
                  router.push(
                    `/session/${sourceSession || node?.sessionId}?tab=transcript${source ? `&source=${encodeURIComponent(source)}#segment-${source}` : ""}`,
                  );
              }}
            />
          </section>
        </>
      ) : (
        <Empty
          title="Belum ada rangkuman materi"
          text="Materi akan tersedia setelah pertemuan selesai."
        />
      )}
    </div>
  );
}
