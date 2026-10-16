import type { Agenda } from "@/lib/types";

export function calendarText(items: Agenda[], names: Record<string, string> = {}) {
  const escape = (text: string) =>
    text
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/[,;]/g, (match) => `\\${match}`);
  const events = items
    .filter((a) => a.confirmed && !a.done)
    .map((a) => {
      const start = new Date(`${a.date}T${a.time}:00+07:00`);
      const stamp = (date: Date) =>
        date
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}Z$/, "Z");
      return [
        "BEGIN:VEVENT",
        `UID:${a.id}@clipthat.local`,
        `DTSTAMP:${new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}Z$/, "Z")}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(new Date(start.getTime() + 30 * 60000))}`,
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
      ].join("\r\n");
    });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClipThat//Agenda//ID",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    "",
  ]
    .join("\r\n")
    .split("\r\n")
    .map(foldLine)
    .join("\r\n");
}

function foldLine(line: string) {
  const encoder = new TextEncoder();
  let result = "",
    width = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (width + length > 75) {
      result += "\r\n ";
      width = 1;
    }
    result += character;
    width += length;
  }
  return result;
}
