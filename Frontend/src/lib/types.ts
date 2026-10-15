export type Role = "student" | "lecturer";

export type LessonStatus = "live" | "upcoming" | "processing" | "done" | "failed";

export type Course = {
  id: string;
  name: string;
  code: string;
  teacher: string;
  color: string;
  glyph: string;
  days: string;
  scheduleTime: string;
  ownerId?: string;
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
  code?: string;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type Segment = { id: string; time: number; end?: number; text: string; topic: string };

export type Question = {
  id: string;
  sessionId: string;
  text: string;
  votes: number;
  supported: boolean;
  oral?: boolean;
  answer?: string;
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
  token?: string;
  sourceCourseId?: string;
  sourceTitle?: string;
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
  sourceSessionId?: string;
  sourceData?: { source_id: string; quote: string; draft_key?: string };
  isDraft?: boolean;
};

export type DemoState = {
  role: Role;
  profile?: { id: string; name: string; role: Role };
  courses?: Course[];
  transcripts?: Record<string, Segment[]>;
  generatedNotes?: Record<string, StudyNote[]>;
  conceptGraphs?: Record<string, ConceptGraph>;
  reviews?: Record<
    string,
    { sections: StudyNote[]; previous: { session_id: string; reason: string }[] }
  >;
  confusion?: Record<string, { start_seconds: number; total: number }[]>;
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

export type StudyNote = {
  title: string;
  body: string;
  formula?: string;
  source_ids?: string[];
  topics?: string[];
};
export type ConceptNode = {
  id: string;
  title: string;
  description: string;
  topics?: string[];
  source_ids: string[];
  sessionId?: string;
  group?: string;
};
export type ConceptGraph = {
  nodes: ConceptNode[];
  edges: { from: string; to: string; relation: string }[];
};
