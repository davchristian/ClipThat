import { api } from "@/lib/api";
import type { Boot, BackendDetail, BackendSaved } from "@/lib/backend-types";
import type { Agenda, DemoState, Lesson, SavedItem } from "@/lib/types";

export const emptyLiveState: DemoState = {
  role: "student",
  lessons: [],
  questions: [],
  saved: [],
  agenda: [],
  notes: {},
  archived: [],
  materials: {},
  graph: [],
  courses: [],
  transcripts: {},
  generatedNotes: {},
  conceptGraphs: {},
  reviews: {},
};
const parts = (value: string) => {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    time: date.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};
export function mapSaved(item: BackendSaved): SavedItem {
  return {
    id: item.id,
    sessionId: item.session_id || "",
    sourceCourseId: item.source_course_id || undefined,
    sourceTitle: item.source_title,
    type: item.kind,
    title: item.title,
    text: item.text,
    summary: item.summary || undefined,
    draft: item.question || undefined,
    time: item.start_seconds,
    end: item.end_seconds ?? undefined,
    label: item.label as SavedItem["label"],
    reviewed: item.reviewed,
  };
}
export function fromBoot(boot: Boot, previous: DemoState): DemoState {
  if (previous.profile?.id !== boot.profile.id) previous = emptyLiveState;
  const ordered = [...boot.sessions].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const lessons: Lesson[] = ordered.map((s) => ({
    id: s.id,
    courseId: s.course_id,
    title: s.title,
    number: ordered.filter((x) => x.course_id === s.course_id).findIndex((x) => x.id === s.id) + 1,
    ...parts(s.starts_at),
    status: s.status,
    duration:
      s.started_at && s.ended_at
        ? `${Math.ceil((+new Date(s.ended_at) - +new Date(s.started_at)) / 60000)} menit`
        : "",
    code: s.join_code,
    startedAt: s.started_at,
    endedAt: s.ended_at,
  }));
  const agenda: Agenda[] = boot.agenda.map((a) => ({
    id: a.id,
    title: a.title,
    ...parts(a.due_at),
    courseId: a.course_id || ordered.find((s) => s.id === a.session_id)?.course_id || "",
    kind: a.kind,
    confirmed: a.confirmed,
    done: a.done,
    reminder: a.reminder ?? true,
    sourceSessionId: a.session_id || undefined,
    source: a.source?.quote,
    sourceData: a.source || undefined,
  }));
  for (const result of boot.results || []) {
    for (const [index, draft] of (result.agenda_drafts || []).entries()) {
      const draftKey = `${result.session_id}:${index}`;
      if (
        agenda.some(
          (a) =>
            a.sourceSessionId === result.session_id &&
            (a.sourceData?.draft_key === draftKey ||
              (!a.sourceData?.draft_key &&
                a.sourceData?.source_id === draft.source_id &&
                a.sourceData?.quote === draft.quote &&
                a.title === draft.title)),
        )
      )
        continue;
      agenda.push({
        id: `draft:${result.session_id}:${index}`,
        title: draft.title,
        ...(draft.due_at ? parts(draft.due_at) : { date: "", time: "" }),
        courseId: ordered.find((s) => s.id === result.session_id)?.course_id || "",
        kind: draft.kind,
        confirmed: false,
        done: false,
        reminder: true,
        source: draft.quote,
        sourceSessionId: result.session_id,
        sourceData: { source_id: draft.source_id, quote: draft.quote, draft_key: draftKey },
        isDraft: true,
      });
    }
  }
  const orphaned: Lesson[] = [];
  for (const item of boot.saved) {
    if (
      !item.session_id ||
      !item.source_course_id ||
      lessons.some((s) => s.id === item.session_id) ||
      orphaned.some((s) => s.id === item.session_id)
    )
      continue;
    orphaned.push({
      id: item.session_id,
      courseId: item.source_course_id,
      title: item.source_title || "Pertemuan sebelumnya",
      number: 0,
      date: "",
      time: "",
      status: "done",
      duration: "",
    });
  }
  const archivedIds = new Set(boot.sessions.filter((s) => s.archived_at).map((s) => s.id));
  return {
    ...emptyLiveState,
    ...previous,
    profile: boot.profile,
    role: boot.profile.role,
    questions: (boot.questions || []).map((q) => ({
      id: q.id,
      sessionId: q.session_id,
      text: q.text,
      time: `${Math.floor(q.at_seconds / 60)}:${String(Math.floor(q.at_seconds % 60)).padStart(2, "0")}`,
      votes: Number(q.votes),
      supported: q.supported,
      oral: q.answered_orally,
      answer: q.answer || undefined,
    })),
    courses: boot.courses.map((c, i) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      teacher: c.teacher_name || "Dosen",
      color: ["sage", "peach", "blue", "sand"][i % 4],
      glyph: ["∑", "⌘", "∫", "⋈"][i % 4],
      days: c.days || "",
      scheduleTime: c.schedule_time || "",
      ownerId: c.owner_id,
    })),
    lessons: lessons.filter((s) => !archivedIds.has(s.id)),
    archived: [...orphaned, ...lessons.filter((s) => archivedIds.has(s.id))].map((lesson) => ({
      lesson,
      archivedAt:
        boot.sessions.find((s) => s.id === lesson.id)?.archived_at || new Date().toISOString(),
    })),
    saved: boot.saved.map((s) => ({
      ...mapSaved(s),
      image: previous.saved.find((p) => p.id === s.id)?.image,
    })),
    agenda,
    handledNotifications: boot.handled_notifications || [],
    generatedNotes: Object.fromEntries((boot.results || []).map((r) => [r.session_id, r.notes])),
    conceptGraphs: Object.fromEntries((boot.results || []).map((r) => [r.session_id, r.graph])),
  };
}
export function withDetail(state: DemoState, id: string, detail: BackendDetail): DemoState {
  return {
    ...state,
    questions: [
      ...state.questions.filter((q) => q.sessionId !== id),
      ...detail.questions.map((q) => ({
        id: q.id,
        sessionId: id,
        text: q.text,
        time: `${Math.floor(q.at_seconds / 60)}:${String(Math.floor(q.at_seconds % 60)).padStart(2, "0")}`,
        votes: Number(q.votes),
        supported: q.supported,
        oral: q.answered_orally,
        answer: q.answer || undefined,
      })),
    ],
    transcripts: {
      ...state.transcripts,
      [id]: detail.transcript.map((s) => ({
        id: s.id,
        time: s.start_seconds,
        end: s.end_seconds,
        text: s.text,
        topic: "Pembahasan kelas",
      })),
    },
    generatedNotes: { ...state.generatedNotes, [id]: detail.results?.notes || [] },
    conceptGraphs: {
      ...state.conceptGraphs,
      [id]: detail.results?.graph || { nodes: [], edges: [] },
    },
    notes: { ...state.notes, [id]: detail.personal_note },
    materials: {
      ...state.materials,
      [id]: detail.materials
        .filter((m) => !m.archived_at)
        .map((m) => ({ id: m.id, name: m.name, url: "" })),
    },
    reviews: { ...state.reviews, [id]: detail.review || { sections: [], previous: [] } },
  };
}
const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
const due = (a: Agenda) => new Date(`${a.date}T${a.time}:00+07:00`).toISOString();
async function uploadData(
  kind: "photos" | "materials",
  sessionId: string,
  url: string,
  name: string,
  time = 0,
) {
  if (!url.startsWith("data:")) throw Error("Pilih berkas lokal terlebih dahulu.");
  const blob = await (await fetch(url)).blob();
  const form = new FormData();
  form.set("session_id", sessionId);
  form.set("file", new File([blob], name, { type: blob.type }));
  form.set("at_seconds", String(time));
  await api(`files/${kind}`, "POST", form);
}
// Persist only explicit user mutations. RLS and route validation remain authoritative.
export async function persistChanges(before: DemoState, after: DemoState) {
  if (before.role !== after.role) throw Error("Peran akun asli tidak dapat diganti dari sidebar.");
  for (const item of before.saved.filter((s) => !after.saved.some((a) => a.id === s.id)))
    await api(`saved/${item.id}`, "DELETE");
  for (const item of after.saved) {
    const old = before.saved.find((s) => s.id === item.id);
    if (!old) {
      if (item.type === "capture") {
        if (!item.token) throw Error("Preview kedaluwarsa. Buat capture lagi.");
        await api("saved/capture", "POST", { token: item.token, question: item.draft });
      }
      if (item.type === "bookmark") {
        const segment = before.transcripts?.[item.sessionId]?.find((s) => s.time === item.time);
        if (!segment) throw Error("Transkrip sumber belum tersedia.");
        await api(`sessions/${item.sessionId}/bookmarks`, "POST", {
          segment_id: segment.id,
          label: item.label || "Review nanti",
        });
      }
      if (item.type === "photo")
        await uploadData("photos", item.sessionId, item.image || "", "foto-papan", item.time);
    } else if (changed(old, item))
      await api(`saved/${item.id}`, "PATCH", {
        reviewed: item.reviewed,
        label: item.label,
        question: item.draft,
      });
  }
  for (const item of before.agenda.filter(
    (a) => !a.isDraft && !after.agenda.some((n) => n.id === a.id),
  ))
    await api(`agenda/${item.id}`, "DELETE");
  for (const item of after.agenda) {
    const old = before.agenda.find((a) => a.id === item.id);
    if (!changed(old, item) || (item.isDraft && !item.confirmed)) continue;
    const payload = {
      title: item.title,
      due_at: due(item),
      kind: item.kind,
      confirmed: item.confirmed,
      done: item.done,
      reminder: item.reminder,
      course_id: item.courseId || null,
    };
    await api(
      old && !old.isDraft ? `agenda/${item.id}` : "agenda",
      old && !old.isDraft ? "PATCH" : "POST",
      old && !old.isDraft
        ? payload
        : { ...payload, session_id: item.sourceSessionId || null, source: item.sourceData || null },
    );
  }
  for (const q of after.questions) {
    const old = before.questions.find((o) => o.id === q.id);
    if (!old) {
      const [m, s] = q.time.split(":").map(Number);
      await api(`sessions/${q.sessionId}/questions`, "POST", {
        text: q.text,
        at_seconds: m * 60 + s,
      });
    } else {
      if (q.supported !== old.supported)
        await api(`questions/${q.id}/support`, "POST", { support: q.supported });
      if (q.answer !== old.answer || q.oral !== old.oral)
        await api(`questions/${q.id}/answer`, "POST", {
          text: q.answer || "",
          oral: q.oral || false,
        });
    }
  }
  for (const s of after.lessons) {
    const old = before.lessons.find((o) => o.id === s.id);
    if (!old && before.archived.some((a) => a.lesson.id === s.id))
      await api(`sessions/${s.id}/restore`, "POST", {});
    else if (old && old.status !== s.status)
      await api(
        `sessions/${s.id}/${s.status === "live" ? "start" : old.status === "failed" ? "retry" : "end"}`,
        "POST",
        {},
      );
  }
  for (const s of before.lessons.filter((s) => !after.lessons.some((a) => a.id === s.id)))
    await api(`sessions/${s.id}/archive`, "POST", {});
  for (const [id, text] of Object.entries(after.notes))
    if (text !== before.notes[id]) await api(`sessions/${id}/personal-note`, "PUT", { text });
  for (const [id, graph] of Object.entries(after.conceptGraphs || {}))
    if (changed(graph, before.conceptGraphs?.[id]))
      await api(`sessions/${id}/graph`, "PUT", {
        nodes: graph.nodes.map(({ id, title, description, topics, source_ids }) => ({
          id,
          title,
          description,
          topics,
          source_ids,
        })),
        edges: graph.edges,
      });
  for (const [sid, materials] of Object.entries(after.materials))
    for (const m of materials)
      if (!before.materials[sid]?.some((old) => old.id === m.id))
        await uploadData("materials", sid, m.url, m.name);
  if (changed(after.handledNotifications, before.handledNotifications))
    await api("notifications", "PUT", { ids: after.handledNotifications || [] });
}
