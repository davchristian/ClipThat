"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { liveMode } from "@/lib/app-mode";
import { api } from "@/lib/api";
import type { Lesson } from "@/lib/types";

export function SessionEntry({ courseId }: { courseId: string }) {
  const { data, update, run, pending } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const created = useRef<string | null>(null);
  const number =
    Math.max(0, ...data.lessons.filter((s) => s.courseId === courseId).map((s) => s.number)) + 1;
  const active = data.lessons.find((s) => s.courseId === courseId && s.status === "live");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title")).trim();
    let id = created.current;
    if (liveMode) {
      const ok = await run(async () => {
        if (!created.current) {
          created.current = (
            await api<{ id: string }>("sessions", "POST", {
              course_id: courseId,
              title,
              starts_at: new Date().toISOString(),
            })
          ).id;
        }
        id = created.current;
        await api(`sessions/${id}/start`, "POST");
      });
      if (!ok) return;
    } else {
      id = crypto.randomUUID();
      const now = new Date();
      const lesson: Lesson = {
        id,
        courseId,
        title,
        number,
        date: now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
        time: now.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "live",
        startedAt: now.toISOString(),
        duration: "90 menit",
      };
      if (!(await update((state) => ({ ...state, lessons: [...state.lessons, lesson] })))) return;
    }
    setOpen(false);
    router.push(`/session/${id}?tab=transcript&record=1`);
  }
  return (
    <>
      <button
        className="button primary"
        onClick={() =>
          active ? router.push(`/session/${active.id}?tab=transcript&record=1`) : setOpen(true)
        }
      >
        <Play size={16} /> {active ? "Lanjutkan kelas" : "Mulai kelas"}
      </button>
      <Modal
        open={open}
        title="Mulai kelas"
        onClose={() => {
          if (!pending) setOpen(false);
        }}
      >
        <form className="form-stack" onSubmit={submit}>
          <label>
            Topik pertemuan
            <input
              name="title"
              defaultValue={`Pertemuan ${number}`}
              minLength={2}
              maxLength={160}
              required
              autoFocus
              disabled={pending || !!created.current}
            />
          </label>
          <button className="button primary" disabled={pending}>
            <Play size={16} /> {pending ? "Menyiapkan…" : "Mulai & rekam"}
          </button>
        </form>
      </Modal>
    </>
  );
}
