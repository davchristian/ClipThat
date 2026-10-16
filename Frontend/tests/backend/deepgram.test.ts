import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { deepgramToken } from "../../src/server/deepgram";
import { deepgramResult } from "../../src/features/live/deepgram-results";
import { transcriptionConfigured, transcriptionProvider } from "../../src/server/transcription";

afterEach(() => {
  delete process.env.DEEPGRAM_API_KEY;
  delete process.env.TRANSCRIPTION_PROVIDER;
});

test("continuous speech crosses 15-second rows using word timestamps even before finalization", () => {
  const result = deepgramResult(
    {
      type: "Results",
      start: 14,
      duration: 3,
      is_final: false,
      channel: {
        alternatives: [
          {
            transcript: "Satu dua.",
            words: [
              { start: 14, end: 14.5, word: "satu", punctuated_word: "Satu" },
              { start: 15, end: 16, word: "dua", punctuated_word: "dua." },
            ],
          },
        ],
      },
    },
    0,
  );
  assert.deepEqual(result?.parts, [
    { start: 14, end: 14.5, text: "Satu" },
    { start: 15, end: 16, text: "dua." },
  ]);
  assert.equal(result?.final, false);
});
test("Deepgram requests only a short-lived token with the server key", async () => {
  process.env.DEEPGRAM_API_KEY = "server-test-only";
  process.env.TRANSCRIPTION_PROVIDER = "deepgram";
  assert.equal(transcriptionProvider(), "deepgram");
  assert.equal(transcriptionConfigured(), true);
  assert.deepEqual(
    await deepgramToken(async (url, init) => {
      assert.equal(String(url), "https://api.deepgram.com/v1/auth/grant");
      assert.equal(init?.method, "POST");
      assert.equal(new Headers(init?.headers).get("Authorization"), "Token server-test-only");
      return Response.json({ access_token: "temporary-test-only", expires_in: 30 });
    }),
    { access_token: "temporary-test-only", expires_in: 30 },
  );
  delete process.env.DEEPGRAM_API_KEY;
  assert.equal(transcriptionConfigured(), false);
});
test("Deepgram failures are actionable without exposing provider responses", async () => {
  process.env.DEEPGRAM_API_KEY = "server-test-only";
  await assert.rejects(
    deepgramToken(async () =>
      Response.json({ secret: "private provider diagnostics" }, { status: 403 }),
    ),
    /izin Member/,
  );
  await assert.rejects(
    deepgramToken(async () => Response.json({ access_token: "", expires_in: 30 })),
    /belum valid/,
  );
});
test("streaming results distinguish drafts and finals and retain session offsets", () => {
  const value = {
    type: "Results",
    start: 1.2,
    duration: 2.5,
    is_final: false,
    channel: { alternatives: [{ transcript: "  Matriks terdiri dari baris dan kolom.  " }] },
  };
  assert.deepEqual(deepgramResult(value, 20), {
    segment: { start: 21.2, end: 23.7, text: "Matriks terdiri dari baris dan kolom." },
    final: false,
  });
  assert.equal(deepgramResult({ ...value, is_final: true }, 20)?.final, true);
  assert.equal(deepgramResult({ ...value, start: NaN }, 20), null);
  assert.equal(deepgramResult({ ...value, duration: -1 }, 20), null);
  assert.equal(
    deepgramResult({ ...value, channel: { alternatives: [{ transcript: " " }] } }, 20),
    null,
  );
  assert.equal(deepgramResult({ type: "Metadata" }, 20), null);
});
