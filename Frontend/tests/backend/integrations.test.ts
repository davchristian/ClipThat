import { test } from "node:test";
import assert from "node:assert/strict";
import { seal, unseal } from "../../src/server/integration-crypto";
import { validateOAuthState } from "../../src/server/calendar";
import { eventPayload, syncEvent } from "../../src/server/calendar-providers";
import { graphForLesson, mergeGraphs } from "../../src/features/graph/graph-data";
import { fromBoot, emptyLiveState } from "../../src/state/live-data";
import type { Boot } from "../../src/lib/backend-types";
test("calendar credentials reject tampering and another user/provider", async () => {
  process.env.INTEGRATION_ENCRYPTION_KEY = "a".repeat(64);
  const value = { access_token: "test-token", refresh_token: "test-refresh" };
  const encoded = await seal(value, "calendar:user:outlook");
  assert.ok(!encoded.includes(value.access_token));
  assert.deepEqual(await unseal(encoded, "calendar:user:outlook"), value);
  await assert.rejects(unseal(encoded, "calendar:other:outlook"));
  await assert.rejects(unseal(encoded, "calendar:user:google"));
  await assert.rejects(unseal(encoded.slice(0, -3) + "xxx", "calendar:user:outlook"));
});
test("OAuth state binds the callback to its initiating user, provider, nonce and expiry", () => {
  const state = {
    userId: "a",
    provider: "outlook" as const,
    nonce: "random",
    verifier: "verifier",
    expires: 200,
  };
  validateOAuthState(state, "a", "outlook", "random", 100);
  for (const work of [
    () => validateOAuthState(state, "b", "outlook", "random", 100),
    () => validateOAuthState(state, "a", "google", "random", 100),
    () => validateOAuthState(state, "a", "outlook", "forged", 100),
    () => validateOAuthState(state, "a", "outlook", "random", 201),
  ])
    assert.throws(work);
});
const agenda = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Kuis",
  due_at: "2026-10-16T09:00:00+07:00",
  kind: "Kuis",
  reminder: true,
};
test("calendar payload preserves Jakarta deadline as UTC and does not invite attendees", () => {
  const event = eventPayload("outlook", agenda) as {
    start: { dateTime: string };
    end: { dateTime: string };
    attendees?: unknown;
  };
  assert.equal(event.start.dateTime, "2026-10-16T02:00:00.000");
  assert.equal(event.end.dateTime, "2026-10-16T02:15:00.000");
  assert.equal(event.attendees, undefined);
});
test("Outlook create retries use stable transaction ID, and updating/deleting use stored event ID", async () => {
  const requests: { url: string; method: string; body: Record<string, unknown> }[] = [];
  const fake: typeof fetch = async (url, init) => {
    requests.push({
      url: String(url),
      method: init?.method || "GET",
      body: JSON.parse(String(init?.body || "{}")),
    });
    return init?.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ id: "event-1" });
  };
  assert.equal(
    await syncEvent("outlook", "token", "calendar", agenda, null, false, fake),
    "event-1",
  );
  await syncEvent("outlook", "token", "calendar", agenda, null, false, fake);
  assert.equal(requests[0].body.transactionId, requests[1].body.transactionId);
  await syncEvent("outlook", "token", "calendar", agenda, "event-1", false, fake);
  await syncEvent("outlook", "token", "calendar", agenda, "event-1", true, fake);
  assert.equal(requests[2].method, "PATCH");
  assert.equal(requests[3].method, "DELETE");
  assert.match(requests[3].url, /events\/event-1$/);
});
test("Google retries an existing deterministic event without creating a duplicate", async () => {
  const methods: string[] = [];
  const fake: typeof fetch = async (_, init) => {
    methods.push(init?.method || "GET");
    return init?.method === "POST"
      ? new Response(null, { status: 409 })
      : Response.json({ id: agenda.id.replace(/-/g, "") });
  };
  assert.equal(
    await syncEvent("google", "token", "primary", agenda, null, false, fake),
    agenda.id.replace(/-/g, ""),
  );
  assert.deepEqual(methods, ["POST", "PATCH"]);
});
test("new account boot drops previous account's private content and keeps agenda drafts unconfirmed", () => {
  const boot: Boot = {
    profile: { id: "new", name: "New user", role: "student" },
    courses: [],
    sessions: [],
    saved: [],
    agenda: [],
    results: [
      {
        session_id: "session",
        notes: [],
        graph: { nodes: [], edges: [] },
        agenda_drafts: [
          {
            title: "Tugas",
            kind: "Tugas",
            due_at: null,
            source_id: "source",
            quote: "Tugas minggu depan",
          },
        ],
      },
    ],
  };
  const previous = {
    ...emptyLiveState,
    profile: { id: "old", name: "Old user", role: "student" as const },
    notes: { session: "private" },
    reviews: { session: { sections: [{ title: "Private", body: "Private" }], previous: [] } },
  };
  const state = fromBoot(boot, previous);
  assert.deepEqual(state.notes, {});
  assert.deepEqual(state.reviews, {});
  assert.equal(state.agenda[0].confirmed, false);
  assert.equal(state.agenda[0].date, "");
});
test("graph merging keeps edges valid and combines explicitly identical subbab titles", () => {
  const lesson = {
    id: "a",
    courseId: "c",
    title: "A",
    number: 1,
    date: "2026-10-10",
    time: "09:00",
    status: "done" as const,
    duration: "",
  };
  const first = graphForLesson(lesson, [
    { title: "Basis", body: "A" },
    { title: "Matriks", body: "B" },
  ]);
  const second = graphForLesson({ ...lesson, id: "b" }, [
    { title: "Matriks", body: "B" },
    { title: "Kernel", body: "C" },
  ]);
  const graph = mergeGraphs([
    { sessionId: "a", graph: first },
    { sessionId: "b", graph: second },
  ]);
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);
  assert.ok(
    graph.edges.every(
      (e) => graph.nodes.some((n) => n.id === e.from) && graph.nodes.some((n) => n.id === e.to),
    ),
  );
});

test("confirming one announcement keeps other drafts from the same transcript segment", () => {
  const first = {
    title: "Tugas pertama",
    kind: "Tugas" as const,
    due_at: "2026-10-16T02:00:00Z",
    source_id: "same-source",
    quote: "Ada dua tugas",
  };
  const boot: Boot = {
    profile: { id: "student", name: "Student", role: "student" },
    courses: [],
    sessions: [],
    saved: [],
    agenda: [
      {
        id: "saved-agenda",
        title: "Judul sudah diedit mahasiswa",
        due_at: first.due_at,
        kind: "Tugas",
        confirmed: true,
        done: false,
        session_id: "session",
        source: { source_id: first.source_id, quote: first.quote, draft_key: "session:0" },
      },
    ],
    results: [
      {
        session_id: "session",
        notes: [],
        graph: { nodes: [], edges: [] },
        agenda_drafts: [first, { ...first, title: "Tugas kedua" }],
      },
    ],
  };
  const state = fromBoot(boot, emptyLiveState);
  assert.equal(state.agenda.length, 2);
  assert.equal(state.agenda.find((a) => !a.confirmed)?.title, "Tugas kedua");
});
