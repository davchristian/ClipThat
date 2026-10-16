const weekdays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Use the day of the recorded class, never the day a delayed job runs.
export function lessonDateContext(session: unknown) {
  const startsAt = (session as { starts_at?: string } | null)?.starts_at;
  if (!startsAt || !Number.isFinite(Date.parse(startsAt))) return null;
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(startsAt));
  const day = new Date(`${date}T00:00:00Z`);
  const after = (offset: number) =>
    new Date(day.getTime() + offset * 86400000).toISOString().slice(0, 10);
  const mondayOffset = -((day.getUTCDay() + 6) % 7);
  return {
    timezone: "Asia/Jakarta",
    offset: "+07:00",
    class_date: date,
    class_weekday: weekdays[day.getUTCDay()],
    tomorrow: after(1),
    day_after_tomorrow: after(2),
    next_week: Object.fromEntries(
      weekdays.map((name, index) => [name, after(mondayOffset + 7 + ((index + 6) % 7))]),
    ),
    next_occurrence: Object.fromEntries(
      weekdays.map((name, index) => [name, after((index - day.getUTCDay() + 7) % 7 || 7)]),
    ),
  };
}
