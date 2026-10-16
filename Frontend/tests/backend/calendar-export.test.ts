import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarText } from "../../src/app/agenda/components/calendar-export";
import type { Agenda } from "../../src/lib/types";
test("manual calendar export preserves Jakarta time in UTC, escapes text and excludes drafts/done events", () => {
  const event: Agenda = {
    id: "one",
    title: "Kuis, matriks; lanjut\nBaris",
    date: "2026-10-16",
    time: "09:00",
    courseId: "course",
    kind: "Kuis",
    confirmed: true,
    done: false,
    reminder: true,
  };
  const ics = calendarText(
    [event, { ...event, id: "draft", confirmed: false }, { ...event, id: "done", done: true }],
    { course: "Aljabar Linear" },
  );
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.ok(ics.includes("DTSTART:20261016T020000Z"));
  assert.ok(ics.includes("DTEND:20261016T023000Z"));
  assert.ok(ics.includes("SUMMARY:Kuis\\, matriks\\; lanjut\\nBaris"));
  assert.ok(ics.includes("DESCRIPTION:Aljabar Linear"));
  assert.ok(ics.includes("BEGIN:VALARM"));
  const long = calendarText([{ ...event, title: "数学".repeat(60) }]);
  assert.ok(long.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
  assert.ok(long.replace(/\r\n /g, "").includes(`SUMMARY:${"数学".repeat(60)}`));
});
