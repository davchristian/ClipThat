"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Download, Pencil, Plus } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { ActionMenu, Empty, Modal, PageHeading } from "@/components/ui";
import { courseFor, demoToday } from "@/data";
import { dateLabel } from "@/lib/format";
import { calendarText } from "./components/calendar-export";
import { downloadText } from "@/lib/files";
import type { Agenda } from "@/lib/types";
import { demoCalendarMonth } from "@/data";
import { AgendaEditor } from "./components/agenda-editor";

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const weekdays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const demoMonth = new Date(demoCalendarMonth.year, demoCalendarMonth.monthIndex, 1, 12);

function kindClass(kind: Agenda["kind"]) {
  return kind === "Kuis" ? "quiz" : kind === "Tugas" ? "assignment" : "study";
}

export default function AgendaPage() {
  const { data, update, notify } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("2026-10-08");
  const [editing, setEditing] = useState<Agenda | "new" | null>(null);
  const [deleting, setDeleting] = useState<Agenda | null>(null);
  if (data.role === "lecturer")
    return (
      <Empty
        title="Agenda pribadi mahasiswa"
        action={
          <Link className="button secondary" href="/">
            Buka kelas
          </Link>
        }
      />
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
  const entries = data.agenda
    .filter((a) => a.confirmed)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const selectedEntries = entries.filter((item) => item.date === selectedDate);
  const drafts = data.agenda.filter((a) => !a.confirmed);

  function moveMonth(delta: number) {
    const nextOffset = monthOffset + delta;
    const nextMonth = new Date(demoMonth.getFullYear(), demoMonth.getMonth() + nextOffset, 1, 12);
    setMonthOffset(nextOffset);
    setSelectedDate(isoDay(nextMonth));
  }

  function showDate(date: string) {
    const selected = new Date(`${date}T12:00:00`);
    setSelectedDate(date);
    setMonthOffset(
      (selected.getFullYear() - demoMonth.getFullYear()) * 12 +
        selected.getMonth() -
        demoMonth.getMonth(),
    );
  }
  return (
    <>
      <PageHeading
        title="Agenda"
        action={
          <div className="heading-actions">
            <button className="button primary" onClick={() => setEditing("new")}>
              <Plus size={16} />
              Tambah
            </button>
            <ActionMenu label="Opsi agenda">
              <button
                onClick={() => {
                  if (!data.agenda.some((a) => a.confirmed && !a.done)) {
                    notify("Belum ada agenda aktif.");
                    return;
                  }
                  downloadText(
                    "clipthat-agenda.ics",
                    calendarText(data.agenda),
                    "text/calendar;charset=utf-8",
                  );
                  notify("Kalender diunduh.");
                }}
              >
                <Download size={16} />
                Unduh kalender (.ics)
              </button>
              <Link href="/settings">Atur kalender</Link>
            </ActionMenu>
          </div>
        }
      />
      {drafts.length > 0 && (
        <section className="drafts-panel">
          <h2>
            Perlu konfirmasi <span>{drafts.length}</span>
          </h2>
          {drafts.map((a) => (
            <div className="draft-row" key={a.id}>
              <div>
                <h3>{a.title}</h3>
                <p>
                  {dateLabel(a.date)} · {a.time}
                </p>
              </div>
              <button className="button secondary small" onClick={() => setEditing(a)}>
                Tinjau
              </button>
            </div>
          ))}
        </section>
      )}
      <section className="calendar-panel" aria-label="Kalender agenda">
        <div className="calendar-toolbar">
          <h2>{monthName}</h2>
          <div className="calendar-controls">
            <button className="button secondary small" onClick={() => showDate(demoToday)}>
              Hari ini
            </button>
            <button
              className="icon-button"
              aria-label="Bulan sebelumnya"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Bulan berikutnya"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
        <div className="calendar-legend" aria-label="Jenis agenda">
          <span className="quiz">Kuis</span>
          <span className="assignment">Tugas</span>
          <span className="study">Belajar</span>
        </div>
        <table className="calendar-grid" aria-label={`Agenda ${monthName}`}>
          <thead>
            <tr>
              {weekdays.map((day) => (
                <th scope="col" key={day}>
                  <abbr title={day}>{day.slice(0, 3)}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, weekIndex) => (
              <tr key={weekIndex}>
                {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
                  if (!day) return <td className="calendar-blank" key={`blank-${dayIndex}`} />;
                  const date = isoDay(new Date(month.getFullYear(), month.getMonth(), day, 12));
                  const dayEntries = entries.filter((item) => item.date === date);
                  const readableDate = new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <td key={date}>
                      <button
                        className={`calendar-day ${selectedDate === date ? "selected" : ""} ${demoToday === date ? "today" : ""}`}
                        aria-label={`${readableDate}, ${dayEntries.length} agenda`}
                        aria-pressed={selectedDate === date}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="calendar-day-number">{day}</span>
                        <span className="calendar-events">
                          {dayEntries.slice(0, 2).map((item) => (
                            <span
                              className={`calendar-event ${kindClass(item.kind)} ${item.done ? "done" : ""}`}
                              key={item.id}
                            >
                              {item.title}
                            </span>
                          ))}
                          {dayEntries.length > 2 && (
                            <span className="calendar-more">+{dayEntries.length - 2} lainnya</span>
                          )}
                        </span>
                        <span className="calendar-dots" aria-hidden="true">
                          {dayEntries.slice(0, 3).map((item) => (
                            <i className={kindClass(item.kind)} key={item.id} />
                          ))}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="selected-agenda" aria-live="polite">
        <div className="selected-agenda-heading">
          <div>
            <span className="eyebrow">TANGGAL DIPILIH</span>
            <h2>
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          <span>{selectedEntries.length} agenda</span>
        </div>
        {selectedEntries.length ? (
          <div className="list-panel">
            {selectedEntries.map((item) => (
              <article className={`agenda-item ${item.done ? "done" : ""}`} key={item.id}>
                <button
                  className="task-check"
                  aria-label={`${item.done ? "Batalkan selesai: " : "Selesaikan: "}${item.title}`}
                  aria-pressed={item.done}
                  onClick={() =>
                    update((state) => ({
                      ...state,
                      agenda: state.agenda.map((entry) =>
                        entry.id === item.id ? { ...entry, done: !entry.done } : entry,
                      ),
                    }))
                  }
                >
                  <Check size={14} />
                </button>
                <span className={`agenda-kind ${kindClass(item.kind)}`}>{item.kind}</span>
                <div className="row-main">
                  <h3>{item.title}</h3>
                  <p>
                    {item.time} · {courseFor(item.courseId).name}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Edit ${item.title}`}
                  onClick={() => setEditing(item)}
                >
                  <Pencil size={16} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="calendar-empty-day">
            <p>Belum ada agenda di tanggal ini.</p>
            <button className="text-button" onClick={() => setEditing("new")}>
              <Plus size={15} />
              Tambah agenda
            </button>
          </div>
        )}
      </section>
      {editing && (
        <AgendaEditor
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          date={selectedDate}
          onSaved={(item) => showDate(item.date)}
          onClose={() => setEditing(null)}
          onDelete={(a) => {
            setEditing(null);
            setDeleting(a);
          }}
        />
      )}
      <Modal
        open={!!deleting}
        title="Hapus agenda?"
        subtitle={deleting?.title}
        onClose={() => setDeleting(null)}
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setDeleting(null)}>
            Batal
          </button>
          <button
            className="button danger"
            onClick={() => {
              update((d) => ({ ...d, agenda: d.agenda.filter((a) => a.id !== deleting?.id) }));
              setDeleting(null);
              notify("Agenda dihapus.");
            }}
          >
            Hapus agenda
          </button>
        </div>
      </Modal>
    </>
  );
}
