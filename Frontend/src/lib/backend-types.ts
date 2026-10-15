export type Profile = { id: string; name: string; role: "student" | "lecturer" };
export type BackendCourse = {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  teacher_name?: string;
  days?: string;
  schedule_time?: string;
};
export type BackendSession = {
  id: string;
  course_id: string;
  title: string;
  starts_at: string;
  started_at: string | null;
  ended_at: string | null;
  status: "upcoming" | "live" | "processing" | "done" | "failed";
  join_code: string;
  archived_at: string | null;
  processing_error: string | null;
};
export type BackendSegment = {
  id: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
};
export type BackendQuestion = {
  id: string;
  text: string;
  at_seconds: number;
  votes: number;
  supported: boolean;
  answer: string | null;
  answered_orally: boolean;
};
export type BackendSaved = {
  source_course_id?: string | null;
  source_title?: string;
  id: string;
  session_id: string | null;
  kind: "bookmark" | "capture" | "photo";
  title: string;
  text: string;
  summary: string | null;
  question: string | null;
  start_seconds: number;
  end_seconds: number | null;
  label: string | null;
  reviewed: boolean;
  storage_path: string | null;
};
export type BackendAgenda = {
  course_id?: string | null;
  reminder?: boolean;
  source?: { source_id: string; quote: string; draft_key?: string } | null;

  id: string;
  title: string;
  due_at: string;
  kind: "Tugas" | "Kuis" | "Belajar";
  confirmed: boolean;
  done: boolean;
  session_id: string | null;
};
export type BackendGraph = {
  nodes: {
    id: string;
    title: string;
    description: string;
    topics?: string[];
    source_ids: string[];
  }[];
  edges: { from: string; to: string; relation: string }[];
};
export type BackendNote = { title: string; body: string; source_ids: string[] };
export type BackendDetail = {
  session: BackendSession;
  transcript: BackendSegment[];
  questions: BackendQuestion[];
  results: {
    notes: BackendNote[];
    graph: BackendGraph;
    agenda_drafts: {
      title: string;
      kind: BackendAgenda["kind"];
      due_at: string | null;
      source_id: string;
      quote: string;
    }[];
  } | null;
  materials: { id: string; name: string; archived_at: string | null }[];
  personal_note: string;
  review: { sections: BackendNote[]; previous: { session_id: string; reason: string }[] } | null;
};
export type CaptureDraft = {
  id: string;
  session_id: string;
  start: number;
  end: number;
  text: string;
  summary: string;
  question: string;
  token: string;
};
export type Boot = {
  questions?: (BackendQuestion & { session_id: string })[];
  profile: Profile;
  courses: BackendCourse[];
  sessions: BackendSession[];
  saved: BackendSaved[];
  agenda: BackendAgenda[];
  results?: ({ session_id: string } & NonNullable<BackendDetail["results"]>)[];
  handled_notifications?: string[];
};
