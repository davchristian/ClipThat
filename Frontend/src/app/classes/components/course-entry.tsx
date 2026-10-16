"use client";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { liveMode } from "@/lib/app-mode";
import { useApp } from "@/state/app-provider";

export function CourseEntry() {
  const { data, run, pending, notify } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!liveMode || data.role !== "lecturer") return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let id = "";
    const ok = await run(async () => {
      const result = await api<{ id: string }>("courses", "POST", {
        name: form.get("name"),
        code: form.get("code"),
        days: form.get("days"),
        schedule_time: form.get("schedule_time"),
      });
      id = result.id;
    });
    if (!ok) return;
    setOpen(false);
    notify("Course dibuat.");
    router.push(`/classes/${id}`);
  }
  return (
    <>
      <button className="button secondary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Buat course
      </button>
      <Modal open={open} title="Buat course" onClose={() => setOpen(false)}>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Nama mata kuliah
            <input name="name" minLength={2} maxLength={120} required autoFocus />
          </label>
          <label>
            Kode mata kuliah
            <input name="code" maxLength={30} />
          </label>
          <div className="form-row">
            <label>
              Hari kuliah
              <input name="days" maxLength={80} placeholder="Senin, Kamis" />
            </label>
            <label>
              Jam kuliah
              <input name="schedule_time" maxLength={40} placeholder="09.00–10.30" />
            </label>
          </div>
          <button className="button primary" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan course"}
          </button>
        </form>
      </Modal>
    </>
  );
}
