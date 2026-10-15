import type { Agenda } from "@/lib/types";

export function calendarText(items: Agenda[], names: Record<string, string> = {}) {
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
        `DTSTAMP:${new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}Z$/, "Z")}`,
        `DTSTART;TZID=Asia/Jakarta:${a.date.replaceAll("-", "")}T${a.time.replace(":", "")}00`,
        "DURATION:PT30M",
        `SUMMARY:${escape(a.title)}`,
        `DESCRIPTION:${escape(names[a.courseId] || "ClipThat")}`,
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
    "PRODID:-//ClipThat//Agenda//ID",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
