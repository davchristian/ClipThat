import { test } from "node:test";
import assert from "node:assert/strict";
import { captureWindow, createLessonResult, gemini, whisper } from "../../src/server/ai";
import { captureSchema, lessonResultSchema } from "../../src/server/schemas";
import { signCapture, verifyCapture } from "../../src/server/capture-token";
import { sameOrigin, body } from "../../src/server/http";
import { z } from "zod";
import { seconds } from "../../src/lib/format";
import { lessonDateContext } from "../../src/server/lesson-dates";

const user = "00000000-0000-4000-8000-000000000001";
test("off-topic speech can complete without inventing study notes or changing transcript", async () => {
  process.env.GEMINI_API_KEY = "test-only";
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [
              { text: JSON.stringify({ notes: [], graph: { nodes: [], edges: [] }, agenda: [] }) },
            ],
          },
        },
      ],
    });
  try {
    const segments = [
      { id: user, start_seconds: 0, end_seconds: 2, text: "Kemarin saya liburan." },
    ];
    const originalSegments = structuredClone(segments);
    assert.deepEqual((await createLessonResult({}, segments)).notes, []);
    assert.deepEqual(segments, originalSegments);
    assert.deepEqual((await createLessonResult({}, [])).notes, []);
  } finally {
    globalThis.fetch = original;
  }
});

test("relative announcements use the class date in Jakarta even when processing later", () => {
  const context = lessonDateContext({ starts_at: "2026-10-16T02:00:00Z" })!;
  assert.equal(context.class_date, "2026-10-16");
  assert.equal(context.next_week.Selasa, "2026-10-20");
  assert.equal(context.next_occurrence.Selasa, "2026-10-20");
  assert.equal(context.tomorrow, "2026-10-17");
  const sunday = lessonDateContext({ starts_at: "2026-10-18T02:00:00Z" })!;
  assert.equal(sunday.next_week.Senin, "2026-10-19");
  const tuesday = lessonDateContext({ starts_at: "2026-10-20T02:00:00Z" })!;
  assert.equal(tuesday.next_week.Selasa, "2026-10-27");
  assert.equal(tuesday.next_occurrence.Selasa, "2026-10-27");
  assert.equal(lessonDateContext({ starts_at: "2026-10-16T18:00:00Z" })!.class_date, "2026-10-17");
  assert.equal(lessonDateContext({}), null);
});
test("class extraction receives date context and accepts schedule-only speech without study notes", async () => {
  process.env.GEMINI_API_KEY = "test-only";
  const original = globalThis.fetch;
  const text = "Minggu depan hari Selasa ada kuis.";
  globalThis.fetch = async (_, init) => {
    const request = JSON.parse(String(init?.body));
    const input = JSON.parse(request.contents[0].parts[0].text);
    assert.equal(input.date_context.next_week.Selasa, "2026-10-20");
    assert.match(request.systemInstruction.parts[0].text, /HANYA materi pelajaran/);
    assert.match(request.systemInstruction.parts[0].text, /cerita masa lalu/);
    return Response.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  notes: [],
                  graph: { nodes: [], edges: [] },
                  agenda: [
                    {
                      title: "Kuis matriks",
                      kind: "Kuis",
                      due_at: "2026-10-20T00:00:00+07:00",
                      source_id: user,
                      quote: text,
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    });
  };
  try {
    const result = await createLessonResult({ starts_at: "2026-10-16T09:00:00+07:00" }, [
      { id: user, start_seconds: 60, end_seconds: 65, text },
    ]);
    assert.deepEqual(result.notes, []);
    assert.equal(result.agenda[0].due_at, "2026-10-20T00:00:00+07:00");
  } finally {
    globalThis.fetch = original;
  }
});

test("lesson generation omits nested provider array caps but validates output limits locally", async () => {
  process.env.GEMINI_API_KEY = "test-only";
  const note = { title: "Matriks", body: "Baris dan kolom", source_ids: [user] };
  let notes = [note];
  const fake: typeof fetch = async (_, init) => {
    const schema = JSON.parse(String(init?.body)).generationConfig.responseJsonSchema;
    assert.equal(JSON.stringify(schema).includes('"maxItems"'), false);
    assert.equal(
      schema.properties.graph.properties.nodes.items.properties.source_ids.items.format,
      "uuid",
    );
    assert.ok(schema.required.includes("notes"));
    return Response.json({
      candidates: [
        {
          content: {
            parts: [
              { text: JSON.stringify({ notes, graph: { nodes: [], edges: [] }, agenda: [] }) },
            ],
          },
        },
      ],
    });
  };
  assert.equal((await gemini(lessonResultSchema, "Materi uji", [], fake)).notes.length, 1);
  notes = Array.from({ length: 41 }, () => note);
  await assert.rejects(gemini(lessonResultSchema, "Materi uji", [], fake), /Hasil AI belum valid/);
});

test("transcript timestamps display whole seconds without floating-point overflow", () => {
  assert.equal(seconds(1214.906499), "20:14");
  assert.equal(seconds(1241.988), "20:41");
  assert.equal(seconds(59.999), "00:59");
  assert.equal(seconds(60), "01:00");
  assert.equal(seconds(3600.5), "60:00");
});
test("90 seconds are seconds; clamp early class and include overlapping speech", () => {
  const s = [
    { id: user, start_seconds: 950, end_seconds: 1025, text: "Satu" },
    { id: user, start_seconds: 1025, end_seconds: 1110, text: "Dua" },
  ];
  const w = captureWindow(s, 1110);
  assert.equal(w.start, 1020);
  assert.equal(w.end - w.start, 90);
  assert.equal(w.segments.length, 2);
  assert.equal(captureWindow([{ ...s[0], start_seconds: 0, end_seconds: 20 }], 20).start, 0);
  assert.throws(() => captureWindow([], 1110));
  assert.throws(() => captureWindow([{ ...s[0], start_seconds: 0, end_seconds: 20 }], 0));
});
test("capture preview signature rejects tampering, other users and expiration", async () => {
  const secret = "x".repeat(64);
  const claims = {
    id: user,
    user_id: user,
    session_id: user,
    start: 1020,
    end: 1110,
    text: "Materi",
    summary: "Ringkasan",
    question: "Apa maknanya?",
    exp: Date.now() + 10000,
  };
  const token = await signCapture(claims, secret);
  assert.equal((await verifyCapture(token, secret, user)).text, "Materi");
  await assert.rejects(verifyCapture(token + "a", secret, user));
  await assert.rejects(verifyCapture(token, secret, "other-user"));
  await assert.rejects(verifyCapture(token, secret, user, claims.exp + 1));
});
test("Gemini uses requested 2.5 model and rejects malformed provider JSON", async () => {
  process.env.GEMINI_API_KEY = "test-only";
  process.env.GEMINI_MODEL = "gemini-2.5-flash";
  const fake: typeof fetch = async (input, init) => {
    assert.match(String(input), /gemini-2\.5-flash:generateContent/);
    const b = JSON.parse(String(init?.body));
    assert.equal(b.generationConfig.responseMimeType, "application/json");
    return Response.json({
      candidates: [
        {
          content: {
            parts: [
              { text: JSON.stringify({ summary: "Ringkasan", question: "Bagaimana caranya?" }) },
            ],
          },
        },
      ],
    });
  };
  assert.equal((await gemini(captureSchema, "Ringkas", [], fake)).summary, "Ringkasan");
  await assert.rejects(
    gemini(captureSchema, "Ringkas", [], async () =>
      Response.json({ candidates: [{ content: { parts: [{ text: "not json" }] } }] }),
    ),
  );
});
test("Whisper preserves segment offsets and sends complete multipart file", async () => {
  process.env.OPENAI_API_KEY = "test-only";
  const fake: typeof fetch = async (_, init) => {
    const f = init?.body as FormData;
    assert.equal(f.get("model"), "whisper-1");
    assert.equal(f.get("response_format"), "verbose_json");
    assert.equal(f.get("timestamp_granularities[]"), "segment");
    return Response.json({ segments: [{ start: 1, end: 5, text: "Materi kelas" }] });
  };
  const output = await whisper(
    new File(["audio"], "chunk.webm", { type: "audio/webm" }),
    90,
    15,
    fake,
  );
  assert.deepEqual(output, [{ start: 91, end: 95, text: "Materi kelas" }]);
  await assert.rejects(whisper(new File(["audio"], "chunk.webm"), 90, 2, fake));
});
test("mutations reject cross-origin requests and oversized/invalid bodies", async () => {
  assert.throws(() =>
    sameOrigin(
      new Request("https://clipthat.test/api/v1/saved", {
        method: "POST",
        headers: { origin: "https://evil.test" },
      }),
    ),
  );
  sameOrigin(
    new Request("https://clipthat.test/api/v1/saved", {
      method: "POST",
      headers: { origin: "https://clipthat.test" },
    }),
  );
  await assert.rejects(
    body(
      new Request("https://clipthat.test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(210000),
      }),
      z.object({}),
    ),
  );
});
