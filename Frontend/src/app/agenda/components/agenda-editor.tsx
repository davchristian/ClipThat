"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { courses, demoTime } from "@/data";
import type { Agenda } from "@/lib/types";

export function AgendaEditor({
  item,
  date,
  onClose,
  onSaved,
  onDelete,
}: {
  item: Agenda | null;
  date: string;
  onClose: () => void;
  onSaved: (item: Agenda) => void;
  onDelete: (item: Agenda) => void;
}) {
  const { update, notify } = useApp();
  const [form, setForm] = useState<Agenda>(
    item || {
      id: crypto.randomUUID(),
      title: "",
      date,
      time: demoTime,
      courseId: "aljabar",
      kind: "Belajar",
      confirmed: true,
      done: false,
      reminder: true,
    },
  );
  function field<K extends keyof Agenda>(key: K, value: Agenda[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <Modal open title={item ? "Edit agenda" : "Tambah agenda"} onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          const result = { ...form, title: form.title.trim(), confirmed: true };
          update((d) => ({
            ...d,
            agenda: item
              ? d.agenda.map((a) => (a.id === item.id ? result : a))
              : [...d.agenda, result],
          }));
          notify("Agenda tersimpan.");
          onSaved(result);
          onClose();
        }}
      >
        {item?.source && <p className="source-quote">{item.source}</p>}
        <label>
          Judul agenda
          <input
            autoFocus
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            maxLength={100}
            placeholder="Review transformasi linear"
            required
          />
        </label>
        <div className="form-row">
          <label>
            Tanggal
            <input
              type="date"
              value={form.date}
              min="2020-01-01"
              max="2100-12-31"
              onChange={(e) => field("date", e.target.value)}
              required
            />
          </label>
          <label>
            Waktu
            <input
              type="time"
              value={form.time}
              onChange={(e) => field("time", e.target.value)}
              required
            />
          </label>
        </div>
        <details className="detail-section">
          <summary>Detail lain</summary>
          <div className="form-row">
            <label>
              Mata kuliah
              <select value={form.courseId} onChange={(e) => field("courseId", e.target.value)}>
                {courses.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jenis
              <select
                value={form.kind}
                onChange={(e) => field("kind", e.target.value as Agenda["kind"])}
              >
                {["Belajar", "Tugas", "Kuis"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={(e) => field("reminder", e.target.checked)}
            />
            Ingatkan sehari sebelumnya
          </label>
        </details>
        <div className="dialog-actions">
          {item && (
            <button
              type="button"
              className="icon-button mr-auto"
              aria-label="Hapus agenda"
              onClick={() => onDelete(item)}
            >
              <Trash2 size={17} />
            </button>
          )}
          <button type="button" className="button secondary" onClick={onClose}>
            Batal
          </button>
          <button className="button primary" disabled={!form.title.trim()}>
            Simpan agenda
          </button>
        </div>
      </form>
    </Modal>
  );
}
