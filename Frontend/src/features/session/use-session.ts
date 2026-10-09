"use client";

import { useEffect } from "react";
import { courseFor, notesForLesson, transcript } from "@/lib/demo-data";
import { seconds } from "@/lib/format";
import type { SavedItem, Segment } from "@/lib/types";
import { useApp } from "@/state/app-provider";

export function useSession(id: string) {
  const { data, ready, update, notify } = useApp();
  const lecturer = data.role === "lecturer";
  const lesson = data.lessons.find((l) => l.id === id && (!lecturer || l.courseId === "aljabar"));
  const course = courseFor(lesson?.courseId || "aljabar");
  const notes = lesson ? notesForLesson(lesson) : [];
  const segments: Segment[] =
    id === "linear-05"
      ? transcript
      : notes.map((n, i) => ({ id: `n${i}`, time: 960 + i * 60, text: n.body, topic: n.title }));
  const elapsed = 1110;
  const saved = data.saved.filter((s) => s.sessionId === id);
  const questions = data.questions.filter((q) => q.sessionId === id);
  useEffect(() => {
    if (lesson?.status !== "processing") return;
    const timer = setTimeout(() => {
      update((d) => ({
        ...d,
        lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "done" } : l)),
      }));
      notify("Catatan siap.");
    }, 1600);
    return () => clearTimeout(timer);
  }, [lesson?.status, id, update, notify]);
  function bookmark(segment: Segment) {
    const exists = saved.some((s) => s.type === "bookmark" && s.time === segment.time);
    update((d) => ({
      ...d,
      saved: exists
        ? d.saved.filter(
            (s) => !(s.sessionId === id && s.type === "bookmark" && s.time === segment.time),
          )
        : [
            ...d.saved,
            {
              id: `${id}-${segment.id}-Review nanti`,
              sessionId: id,
              type: "bookmark",
              title: segment.topic,
              text: segment.text,
              time: segment.time,
              label: "Review nanti",
              reviewed: false,
            },
          ],
    }));
    notify(exists ? "Penanda dihapus." : "Bagian tersimpan.");
  }
  function capture() {
    const excerpt = segments.filter((s) => s.time >= elapsed - 90 && s.time <= elapsed);
    const item: SavedItem = {
      id: crypto.randomUUID(),
      sessionId: id,
      type: "capture",
      title: `Capture · ${seconds(elapsed - 90)}`,
      text: excerpt.map((s) => s.text).join(" "),
      summary:
        id === "linear-05"
          ? "Susun matriks transformasi dari hasil pemetaan vektor basis. Setiap hasil pemetaan menjadi satu kolom matriks."
          : excerpt.map((s) => s.topic).join(" · "),
      time: elapsed - 90,
      end: elapsed,
      reviewed: false,
      draft:
        id === "linear-05"
          ? "Bagaimana menentukan kolom matriks dari pemetaan vektor basis?"
          : `Bisa dijelaskan kembali bagian ${excerpt[0]?.topic.toLowerCase() || "ini"}?`,
    };
    update((d) => ({ ...d, saved: [...d.saved, item] }));
    notify("Capture tersimpan.");
  }
  return {
    data,
    ready,
    update,
    notify,
    lecturer,
    lesson,
    course,
    notes,
    segments,
    elapsed,
    saved,
    questions,
    bookmark,
    capture,
  };
}
