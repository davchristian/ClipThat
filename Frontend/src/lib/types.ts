export type Role = "student" | "lecturer";

export type LessonStatus = "live" | "upcoming" | "processing" | "done";

export type Course = {
  id: string;
  name: string;
  code: string;
  teacher: string;
  color: string;
  glyph: string;
  days: string;
  scheduleTime: string;
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  number: number;
  date: string;
  time: string;
  status: LessonStatus;
  duration: string;
};

export type Segment = { id: string; time: number; text: string; topic: string };

export type Question = {
  id: string;
  sessionId: string;
  text: string;
  votes: number;
  supported: boolean;
  answer?: string;
  oral?: boolean;
  time: string;
};

export type SavedItem = {
  id: string;
  sessionId: string;
  type: "bookmark" | "capture" | "photo";
  title: string;
  text: string;
  summary?: string;
  time: number;
  end?: number;
  reviewed: boolean;
  label?: "Bingung" | "Review nanti";
  image?: string;
  draft?: string;
};

export type Agenda = {
  id: string;
  title: string;
  date: string;
  time: string;
  courseId: string;
  kind: "Tugas" | "Kuis" | "Belajar";
  confirmed: boolean;
  done: boolean;
  reminder: boolean;
  source?: string;
};

export type DemoState = {
  role: Role;
  handledNotifications?: string[];
  lessons: Lesson[];
  questions: Question[];
  saved: SavedItem[];
  agenda: Agenda[];
  notes: Record<string, string>;
  archived: { lesson: Lesson; archivedAt: string }[];
  materials: Record<string, { id: string; name: string; url: string }[]>;
  graph: { from: number; to: number; relation: string }[];
  graphBySession?: Record<string, { from: number; to: number; relation: string }[]>;
};
