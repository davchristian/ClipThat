import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanNoteText } from "../../src/lib/note-text";

test("notes hide source UUID citations while preserving material and formulas", () => {
  const id = "3f0533ea-5129-4684-bc1c-aea38a3d639e";
  assert.equal(cleanNoteText(`Pengantar [${id}].`), "Pengantar.");
  assert.equal(cleanNoteText(`Satu [${id}, ${id}] dan dua [${id}].`), "Satu dan dua.");
  assert.equal(cleanNoteText("Matriks [1, 2] dan [x + y]."), "Matriks [1, 2] dan [x + y].");
});
