"use client";
import { useApp } from "@/state/app-provider";
import { liveMode } from "@/lib/app-mode";
import {
  courses as demoCourses,
  notesForLesson as demoNotes,
  transcriptByLesson as demoTranscripts,
} from "@/data";
import type { Course, Lesson, StudyNote } from "@/lib/types";
export function useContent() {
  const { data } = useApp();
  const courses = liveMode ? data.courses || [] : demoCourses;
  const courseFor = (id: string): Course =>
    courses.find((c) => c.id === id) || {
      id,
      name: "Pribadi",
      code: "",
      teacher: "",
      color: "sage",
      glyph: "∑",
      days: "",
      scheduleTime: "",
    };
  const notesForLesson = (lesson: Lesson): StudyNote[] =>
    liveMode ? data.generatedNotes?.[lesson.id] || [] : demoNotes(lesson);
  return {
    courses,
    courseFor,
    notesForLesson,
    transcriptByLesson: liveMode ? data.transcripts || {} : demoTranscripts,
  };
}
