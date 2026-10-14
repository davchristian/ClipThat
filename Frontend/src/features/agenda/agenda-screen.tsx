"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  Pencil,
  Plus,
} from "lucide-react";
import { useApp } from "@/state/app-provider";
import { ActionMenu, Empty, Modal, PageHeading } from "@/components/ui";
import { courseFor } from "@/lib/demo-data";
import { dateLabel } from "@/lib/format";
import { calendarText } from "@/lib/calendar";
import { downloadText } from "@/lib/files";
import type { Agenda } from "@/lib/types";
import { AgendaEditor } from "./agenda-editor";

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function AgendaView() {
  const { data, update, notify } = useApp();
  const [week, setWeek] = useState(0);
  const [editing, setEditing] = useState<Agenda | "new" | null>(null);
  const [deleting, setDeleting] = useState<Agenda | null>(null);
  if (data.role === "lecturer")
    return (
      <Empty
        icon={Lock}
        title="Agenda pribadi mahasiswa"
        text="Mahasiswa menyusun agenda dari kelas yang mereka ikuti. Isinya hanya terlihat oleh mereka."
        action={
          <Link className="button secondary" href="/">
            Buka kelas
          </Link>
        }
      />
    );
  const start = isoDay(new Date(2026, 9, 5 + week * 7, 12));
  const finish = isoDay(new Date(2026, 9, 11 + week * 7, 12));
  const entries = data.agenda
    .filter((a) => a.confirmed && a.date >= start && a.date <= finish)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const dates = [...new Set(entries.map((a) => a.date))];
  const drafts = data.agenda.filter((a) => !a.confirmed);
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
                    notify("Belum ada agenda aktif untuk diunduh.", { kind: "info" });
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
      <div className="week-header">
        <h2>
          {dateLabel(start)} – {dateLabel(finish)}
        </h2>
        <div>
          <button className="text-button" onClick={() => setWeek(0)}>
            Minggu ini
          </button>
          <button
            className="icon-button small"
            aria-label="Minggu sebelumnya"
            onClick={() => setWeek((w) => w - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button small"
            aria-label="Minggu berikutnya"
            onClick={() => setWeek((w) => w + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {dates.map((date) => (
        <section className="agenda-group" key={date}>
          <h2>
            {new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h2>
          <div className="list-panel">
            {entries
              .filter((a) => a.date === date)
              .map((a) => (
                <article className={`agenda-item ${a.done ? "done" : ""}`} key={a.id}>
                  <button
                    className="task-check"
                    aria-label={`${a.done ? "Batalkan selesai: " : "Selesaikan: "}${a.title}`}
                    aria-pressed={a.done}
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        agenda: d.agenda.map((item) =>
                          item.id === a.id ? { ...item, done: !item.done } : item,
                        ),
                      }))
                    }
                  >
                    <Check size={16} />
                  </button>
                  <div className="row-main">
                    <h3>{a.title}</h3>
                    <p>
                      {a.time} · {courseFor(a.courseId).name}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${a.title}`}
                    onClick={() => setEditing(a)}
                  >
                    <Pencil size={16} />
                  </button>
                </article>
              ))}
          </div>
        </section>
      ))}
      {!entries.length && (
        <Empty
          icon={CalendarPlus}
          title="Belum ada agenda minggu ini"
          text="Tambahkan tugas atau jadwal belajar sendiri. Tenggat dari pengumuman kelas juga muncul di sini untuk dikonfirmasi."
          action={
            <button className="button secondary" onClick={() => setEditing("new")}>
              <Plus size={16} />
              Tambah agenda
            </button>
          }
        />
      )}
      {editing && (
        <AgendaEditor
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          date={start}
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
