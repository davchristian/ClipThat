"use client";
import { useEffect, useState } from "react";
import { useContent } from "@/data/use-content";
import { seconds } from "@/lib/format";
import type { SavedItem, Segment } from "@/lib/types";
import type { CaptureDraft } from "@/lib/backend-types";
import { useApp } from "@/state/app-provider";
import { liveMode } from "@/lib/app-mode";
import { api } from "@/lib/api";
export function useSession(id: string) {
  const { data, ready, update, notify, pending, reload } = useApp();
  const { courseFor, notesForLesson, transcriptByLesson } = useContent();
  const lecturer = data.role === "lecturer";
  const lesson = data.lessons.find(
    (l) => l.id === id && (liveMode || !lecturer || l.courseId === "aljabar"),
  );
  const course = courseFor(lesson?.courseId || "aljabar");
  const notes = lesson ? notesForLesson(lesson) : [];
  const rawSegments: Segment[] =
    transcriptByLesson[id] ||
    (liveMode
      ? []
      : notes.map((n, i) => ({ id: `n${i}`, time: 960 + i * 60, text: n.body, topic: n.title })));
  const segments = rawSegments.map((segment, index) => ({
    ...segment,
    end: segment.end ?? rawSegments[index + 1]?.time ?? segment.time + 30,
  }));
  const [now, setNow] = useState(Date.now());
  const [preview, setPreview] = useState<SavedItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const elapsed = liveMode
    ? Math.max(
        0,
        Math.min(
          86400,
          lesson?.startedAt
            ? Math.floor(
                ((lesson.endedAt ? +new Date(lesson.endedAt) : now) - +new Date(lesson.startedAt)) /
                  1000,
              )
            : 0,
        ),
      )
    : 1110;
  const saved = data.saved.filter((s) => s.sessionId === id);
  const questions = data.questions.filter((q) => q.sessionId === id);
  useEffect(() => {
    if (lesson?.status !== "live" || !liveMode) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lesson?.status]);
  useEffect(() => {
    setPreview(null);
  }, [id]);
  useEffect(() => {
    if (liveMode || lesson?.status !== "processing") return;
    const timer = setTimeout(() => {
      void update((d) => ({
        ...d,
        lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "done" } : l)),
      }));
      notify("Catatan siap.");
    }, 1600);
    return () => clearTimeout(timer);
  }, [lesson?.status, id, update, notify]);
  async function bookmark(segment: Segment, label: "Bingung" | "Review nanti" = "Review nanti") {
    const old = saved.find((s) => s.type === "bookmark" && s.time === segment.time);
    const remove = old?.label === label;
    const ok = await update((d) => ({
      ...d,
      saved: remove
        ? d.saved.filter((s) => s.id !== old!.id)
        : old
          ? d.saved.map((s) => (s.id === old.id ? { ...s, label } : s))
          : [
              ...d.saved,
              {
                id: crypto.randomUUID(),
                sessionId: id,
                type: "bookmark",
                title: segment.topic,
                text: segment.text,
                time: segment.time,
                label,
                reviewed: false,
              },
            ],
    }));
    if (ok) notify(remove ? "Penanda dihapus." : "Bagian tersimpan.");
  }
  async function capture() {
    if (previewLoading || preview || pending || lesson?.status !== "live") return;
    setPreviewLoading(true);
    try {
      if (liveMode) {
        const c = await api<CaptureDraft>(`sessions/${id}/capture-preview`, "POST", {});
        setPreview({
          id: c.id,
          sessionId: id,
          type: "capture",
          title: `Capture · ${seconds(c.start)}`,
          text: c.text,
          summary: c.summary,
          time: c.start,
          end: c.end,
          draft: c.question,
          token: c.token,
          reviewed: false,
        });
      } else {
        const start = Math.max(0, elapsed - 90);
        const excerpt = segments.filter((s) => s.time <= elapsed && (s.end ?? s.time + 45) > start);
        if (!excerpt.length) throw Error("Belum ada transkrip untuk dicapture.");
        setPreview({
          id: crypto.randomUUID(),
          sessionId: id,
          type: "capture",
          title: `Capture · ${seconds(start)}`,
          text: excerpt.map((s) => s.text).join(" "),
          summary:
            id === "linear-05"
              ? "Susun matriks transformasi dari hasil pemetaan vektor basis. Setiap hasil pemetaan menjadi satu kolom matriks."
              : excerpt.map((s) => s.topic).join(" · "),
          time: start,
          end: elapsed,
          reviewed: false,
          draft: "Bagaimana menentukan kolom matriks dari pemetaan vektor basis?",
        });
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "Preview belum bisa dibuat.");
    } finally {
      setPreviewLoading(false);
    }
  }
  async function saveCapture() {
    if (!preview || pending) return;
    if (
      await update((d) => ({
        ...d,
        saved: d.saved.some((s) => s.id === preview.id) ? d.saved : [...d.saved, preview],
      }))
    ) {
      setPreview(null);
      notify("Capture tersimpan.");
    }
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
    preview,
    previewLoading,
    saveCapture,
    discardCapture: () => {
      if (!pending) setPreview(null);
    },
    setPreview,
    pending,
    reload,
  };
}
