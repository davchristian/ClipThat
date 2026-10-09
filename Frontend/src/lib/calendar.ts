import { courseFor } from "./demo-data";
import type { Agenda } from "./types";

export function calendarText(items: Agenda[]) {
  const escape = (text: string) =>
    text
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/[,;]/g, (match) => `\\${match}`);
  const events = items
    .filter((a) => a.confirmed && !a.done)
    .map((a) =>
      [
        "BEGIN:VEVENT",
        `UID:${a.id}@clipthat.local`,
        "DTSTAMP:20261005T000000Z",
        `DTSTART;TZID=Asia/Jakarta:${a.date.replaceAll("-", "")}T${a.time.replace(":", "")}00`,
        "DURATION:PT30M",
        `SUMMARY:${escape(a.title)}`,
        `DESCRIPTION:${escape(courseFor(a.courseId).name)}`,
        ...(a.reminder
          ? [
              "BEGIN:VALARM",
              "TRIGGER:-P1D",
              "ACTION:DISPLAY",
              `DESCRIPTION:${escape(a.title)}`,
              "END:VALARM",
            ]
          : []),
        "END:VEVENT",
      ].join("\r\n"),
    );
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClipThat//Agenda Demo//ID",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
