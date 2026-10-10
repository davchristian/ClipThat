"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { demoToday, demoTime } from "@/data";
import type { Lesson } from "@/lib/types";

export function SessionEntry() {
  const [open, setOpen] = useState(false);
  const { data, update, notify } = useApp();
  const router = useRouter();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title")).trim();
    if (!title) return;
    const id = `kelas-${crypto.randomUUID().slice(0, 8)}`;
    const number =
      Math.max(
        0,
        ...[...data.lessons, ...data.archived.map((a) => a.lesson)]
          .filter((s) => s.courseId === "aljabar")
          .map((s) => s.number),
      ) + 1;
    const lesson: Lesson = {
      id,
      title,
      courseId: "aljabar",
      number,
      date: String(form.get("date")),
      time: String(form.get("time")),
      status: "upcoming",
      duration: "90 menit",
    };
    update((d) => ({ ...d, lessons: [...d.lessons, lesson] }));
    setOpen(false);
    notify("Sesi dibuat.");
    router.push(`/session/${id}`);
  }
  return (
    <>
      <button className="button primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Buat sesi
      </button>
      <Modal open={open} title="Buat sesi" onClose={() => setOpen(false)}>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Topik pertemuan
            <input name="title" placeholder="Nilai eigen" maxLength={90} required autoFocus />
          </label>
          <div className="form-row">
            <label>
              Tanggal
              <input type="date" name="date" defaultValue={demoToday} required />
            </label>
            <label>
              Waktu
              <input type="time" name="time" defaultValue={demoTime} required />
            </label>
          </div>
          <button className="button primary">
            Buat sesi kelas
            <ArrowRight size={16} />
          </button>
        </form>
      </Modal>
    </>
  );
}
