import { test } from "node:test";
import assert from "node:assert/strict";
import { captureWindow, gemini, whisper } from "../../src/server/ai";
import { captureSchema } from "../../src/server/schemas";
import { signCapture, verifyCapture } from "../../src/server/capture-token";
import { sameOrigin, body } from "../../src/server/http";
import { z } from "zod";

const user = "00000000-0000-4000-8000-000000000001";
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
