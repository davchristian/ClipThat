"use client";

import { liveMode } from "@/lib/app-mode";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { demoCalendarMonth, demoToday } from "@/data";

export type HomeCalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: "Kuis" | "Tugas" | "Belajar" | "Kelas";
  courseName: string;
  href: string;
};

const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const demoMonth = liveMode
  ? new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12)
  : new Date(demoCalendarMonth.year, demoCalendarMonth.monthIndex, 1, 12);

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function kindClass(kind: HomeCalendarEvent["kind"]) {
  return kind === "Kuis" ? "quiz" : kind === "Tugas" ? "assignment" : "study";
}

export function HomeCalendar({
  events,
  initialDate,
}: {
  events: HomeCalendarEvent[];
  initialDate: string;
}) {
  const today = liveMode
    ? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    : demoToday;
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    liveMode ? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }) : initialDate,
  );
  const month = new Date(demoMonth.getFullYear(), demoMonth.getMonth() + monthOffset, 1, 12);
  const monthName = month.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 },
    (_, index) =>
      index >= firstWeekday && index < firstWeekday + daysInMonth ? index - firstWeekday + 1 : null,
  );
  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const selectedLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });

  function moveMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12);
    setMonthOffset((offset) => offset + delta);
    setSelectedDate(isoDay(next));
  }

  return (
    <div className="home-calendar" aria-label={`Kalender ${monthName}`}>
      <div className="home-calendar-header mb-7">
        <h3>{monthName}</h3>
        <div className="home-calendar-controls">
          <button
            className="icon-button"
            aria-label="Bulan sebelumnya"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Bulan berikutnya"
            onClick={() => moveMonth(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="home-calendar-weekdays" aria-hidden="true">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="home-calendar-days">
        {cells.map((day, index) => {
          if (!day) return <span className="home-calendar-blank" key={`blank-${index}`} />;
          const date = isoDay(new Date(month.getFullYear(), month.getMonth(), day, 12));
          const dayEvents = events.filter((event) => event.date === date);
          const readableDate = new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          return (
            <button
              className={`home-calendar-day ${selectedDate === date ? "selected" : ""} ${today === date ? "today" : ""}`}
              aria-label={`${readableDate}, ${dayEvents.length} agenda`}
              aria-pressed={selectedDate === date}
              onClick={() => setSelectedDate(date)}
              key={date}
            >
              <span>{day}</span>
              <span className="home-calendar-dots" aria-hidden="true">
                {dayEvents.slice(0, 2).map((event) => (
                  <i className={kindClass(event.kind)} key={event.id} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="home-calendar-selection" aria-live="polite">
        <div>
          <span className="eyebrow">{selectedLabel}</span>
          <strong>{selectedEvents.length ? selectedEvents[0].title : "Belum ada agenda"}</strong>
          {selectedEvents.length > 1 && <small>+{selectedEvents.length - 1} agenda lainnya</small>}
        </div>
        {selectedEvents[0] && (
          <Link
            className="home-calendar-study"
            href={selectedEvents[0].href}
            aria-label={`Pelajari ${selectedEvents[0].courseName}`}
          >
            Pelajari <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
