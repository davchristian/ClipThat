import { test } from "node:test";
import assert from "node:assert/strict";
import { transcriptRows } from "../../src/features/live/transcript-rows";

const saved = { id: "source-1", time: 16, end: 18, text: "Satu.", topic: "" };
test("live text extends its 15-second row immediately and starts the next interval", () => {
  const rows = transcriptRows([saved], {
    time: 19,
    text: "Dua. Tiga",
    segments: [
      { start: 19, end: 21, text: "Dua." },
      { start: 31, end: 32, text: "Tiga" },
    ],
  });
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => [row.time, row.text]),
    [
      [15, "Satu. Dua."],
      [30, "Tiga"],
    ],
  );
  assert.equal(rows[0].pending, true);
  assert.deepEqual(rows[0].sourceIds, ["source-1"]);
});
test("uploaded speech appears once while draft awaits acknowledgement", () => {
  const rows = transcriptRows([saved], {
    time: 16,
    text: "Satu.",
    segments: [{ start: 16, end: 18, text: "Satu." }],
  });
  assert.equal(rows[0].text, "Satu.");
  assert.equal(rows[0].pending, false);
  assert.equal(saved.time, 16);
});
