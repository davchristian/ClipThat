import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  transcribeAudio,
  transcriptionConfigured,
  transcriptionProvider,
} from "../../src/server/transcription";
import { ApiError } from "../../src/server/http";

const names = [
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "GEMINI_TRANSCRIPTION_MODEL",
  "OPENAI_API_KEY",
  "TRANSCRIPTION_PROVIDER",
];
let previous: Record<string, string | undefined>;
beforeEach(() => {
  previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  process.env.GEMINI_API_KEY = "test-only";
  process.env.GEMINI_MODEL = "gemini-2.5-flash";
  process.env.TRANSCRIPTION_PROVIDER = "gemini";
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_TRANSCRIPTION_MODEL;
});
afterEach(() => {
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

const audio = () =>
  new File(["test audio bytes"], "chunk.webm", { type: "audio/webm;codecs=opus" });
const reply = (segments: unknown[]) =>
  Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ segments }) }] } }] });

test("Gemini microphone chunks include audio bytes and retain session timestamps", async () => {
  const fake: typeof fetch = async (url, init) => {
    assert.match(String(url), /gemini-2\.5-flash:generateContent$/);
    assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-only");
    const request = JSON.parse(String(init?.body));
    const parts = request.contents[0].parts;
    assert.deepEqual(JSON.parse(parts[0].text), { duration_seconds: 15 });
    assert.equal(parts[1].inlineData.mimeType, "audio/webm");
    assert.equal(Buffer.from(parts[1].inlineData.data, "base64").toString(), "test audio bytes");
    assert.equal(request.generationConfig.responseMimeType, "application/json");
    return reply([{ start: 1, end: 5, text: "  Materi kelas  " }]);
  };
  assert.deepEqual(await transcribeAudio(audio(), 90, 15, fake), [
    { start: 91, end: 95, text: "Materi kelas" },
  ]);
});

test("silent audio produces no transcript segments", async () => {
  assert.deepEqual(await transcribeAudio(audio(), 0, 15, async () => reply([])), []);
});

test("dedicated Transcribe model uses Interactions and measured chunk timestamps", async () => {
  process.env.GEMINI_TRANSCRIPTION_MODEL = "gemini-3.5-transcribe";
  const result = await transcribeAudio(audio(), 90, 15, async (url, init) => {
    assert.equal(String(url), "https://generativelanguage.googleapis.com/v1beta/interactions");
    const request = JSON.parse(String(init?.body));
    assert.equal(request.model, "gemini-3.5-transcribe");
    assert.equal(request.store, false);
    assert.equal(request.generationConfig, undefined);
    assert.equal(request.systemInstruction, undefined);
    assert.equal(request.input[0].type, "audio");
    assert.equal(request.input[0].mime_type, "audio/webm");
    assert.equal(Buffer.from(request.input[0].data, "base64").toString(), "test audio bytes");
    return Response.json({
      status: "completed",
      steps: [
        { type: "model_input", content: [{ type: "text", text: "Do not show this input" }] },
        { type: "model_output", content: [{ type: "text", text: "  Materi kelas.  " }] },
      ],
    });
  });
  assert.deepEqual(result, [{ start: 90, end: 105, text: "Materi kelas." }]);
  assert.equal(process.env.GEMINI_MODEL, "gemini-2.5-flash");
});

test("dedicated speech silence is empty and malformed or incomplete responses are rejected", async () => {
  process.env.GEMINI_TRANSCRIPTION_MODEL = "gemini-3.5-transcribe";
  assert.deepEqual(
    await transcribeAudio(audio(), 0, 15, async () => Response.json({ status: "completed" })),
    [],
  );
  for (const response of [
    { status: "in_progress" },
    {},
    { status: "completed", steps: [{ type: "model_output", content: [{ type: "text" }] }] },
  ])
    await assert.rejects(
      transcribeAudio(audio(), 0, 15, async () => Response.json(response)),
      (error: unknown) => error instanceof ApiError && error.code === "invalid_ai_result",
    );
});

test("dedicated speech maps browser MP4 audio to M4A and preserves provider errors", async () => {
  process.env.GEMINI_TRANSCRIPTION_MODEL = "gemini-3.5-transcribe";
  const file = new File(["audio"], "audio.mp4", { type: "audio/mp4" });
  await assert.rejects(
    transcribeAudio(file, 0, 15, async (_, init) => {
      assert.equal(JSON.parse(String(init?.body)).input[0].mime_type, "audio/m4a");
      return new Response("private provider details", { status: 429 });
    }),
    (error: unknown) => error instanceof ApiError && error.code === "ai_rate_limited",
  );
});

test("Gemini rejects invalid timestamps and malformed output before persistence", async () => {
  for (const segments of [
    [{ start: 5, end: 3, text: "Materi" }],
    [{ start: 1, end: 20, text: "Materi" }],
    [{ start: -1, end: 2, text: "Materi" }],
    [{ start: 3, end: 3, text: "Materi" }],
    [
      { start: 3, end: 5, text: "Materi" },
      { start: 1, end: 2, text: "Lain" },
    ],
  ]) {
    await assert.rejects(transcribeAudio(audio(), 0, 15, async () => reply(segments)));
  }
  await assert.rejects(
    transcribeAudio(audio(), 0, 15, async () =>
      Response.json({ candidates: [{ content: { parts: [{ text: "not JSON" }] } }] }),
    ),
    (error: unknown) => error instanceof ApiError && error.code === "invalid_ai_result",
  );
});

test("quota failures stay retryable and do not switch to a paid provider", async () => {
  process.env.OPENAI_API_KEY = "unused-test-key";
  let requests = 0;
  await assert.rejects(
    transcribeAudio(audio(), 0, 15, async (url) => {
      requests++;
      assert.match(String(url), /generativelanguage\.googleapis\.com/);
      return new Response("provider diagnostics", { status: 429 });
    }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 429 &&
      !error.message.includes("provider diagnostics"),
  );
  assert.equal(requests, 1);
});

test("Gemini errors distinguish depleted credits, model access, and temporary quotas", async () => {
  for (const [providerStatus, appStatus, code] of [
    [402, 503, "ai_billing_required"],
    [404, 503, "ai_model_unavailable"],
    [401, 503, "ai_access_denied"],
    [403, 503, "ai_access_denied"],
    [429, 429, "ai_rate_limited"],
    [400, 502, "ai_unavailable"],
    [503, 502, "ai_unavailable"],
  ] as const) {
    await assert.rejects(
      transcribeAudio(
        audio(),
        0,
        15,
        async () =>
          new Response("private provider diagnostics test-only", { status: providerStatus }),
      ),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === appStatus &&
        error.code === code &&
        !error.message.includes("private provider diagnostics") &&
        !error.message.includes("test-only"),
    );
  }
});

test("provider configuration supports Gemini and explicitly selected Whisper", async () => {
  assert.equal(transcriptionConfigured(), true);
  delete process.env.GEMINI_API_KEY;
  assert.equal(transcriptionConfigured(), false);
  process.env.OPENAI_API_KEY = "test-only";
  assert.equal(transcriptionConfigured(), false);
  process.env.TRANSCRIPTION_PROVIDER = "whisper";
  assert.equal(transcriptionConfigured(), true);
  assert.deepEqual(
    await transcribeAudio(audio(), 0, 15, async (url, init) => {
      assert.equal(String(url), "https://api.openai.com/v1/audio/transcriptions");
      assert.equal((init?.body as FormData).get("model"), "whisper-1");
      return Response.json({ segments: [{ start: 0, end: 2, text: "Ucapan" }] });
    }),
    [{ start: 0, end: 2, text: "Ucapan" }],
  );
  delete process.env.TRANSCRIPTION_PROVIDER;
  assert.equal(transcriptionProvider(), "whisper");
  process.env.GEMINI_API_KEY = "test-only";
  assert.equal(transcriptionProvider(), "gemini");
  process.env.TRANSCRIPTION_PROVIDER = "invalid";
  assert.throws(() => transcriptionConfigured(), ApiError);
});

test("invalid audio and chunk duration are rejected without contacting Gemini", async () => {
  const noRequest: typeof fetch = async () => {
    assert.fail("Invalid input must not be sent to Gemini");
  };
  for (const file of [
    new File([], "empty.webm", { type: "audio/webm" }),
    new File(["text"], "text.txt", { type: "text/plain" }),
    new File([new Uint8Array(5_000_001)], "large.webm", { type: "audio/webm" }),
  ]) {
    await assert.rejects(transcribeAudio(file, 0, 15, noRequest), ApiError);
  }
  for (const duration of [0, NaN, Infinity, 91])
    await assert.rejects(transcribeAudio(audio(), 0, duration, noRequest), ApiError);
  await assert.rejects(transcribeAudio(audio(), -1, 15, noRequest), ApiError);
});
