"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, LogIn } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { demoToday, demoTime } from "@/data";
import { useContent } from "@/data/use-content";
import { liveMode } from "@/lib/app-mode";
import { api } from "@/lib/api";
import type { Lesson } from "@/lib/types";
export function SessionEntry({ courseId }: { courseId?: string }) {
  const { data, update, run, pending, notify } = useApp();
  const { courses } = useContent();
  const router = useRouter();
  const lecturer = data.role === "lecturer";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(courseId || courses[0]?.id || "");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    let id = "";
    if (liveMode) {
      const ok = await run(async () => {
        if (!lecturer) {
          id = (
            await api<{ id: string }>("sessions/join", "POST", {
              code: String(form.get("code")).trim(),
            })
          ).id;
          return;
        }
        let cid = selected;
        if (!cid)
          cid = (
            await api<{ id: string }>("courses", "POST", {
              name: form.get("course_name"),
              code: String(form.get("course_code") || ""),
              days: String(form.get("days") || ""),
              schedule_time: String(form.get("schedule_time") || ""),
            })
          ).id;
        id = (
          await api<{ id: string }>("sessions", "POST", {
            course_id: cid,
            title: form.get("title"),
            starts_at: new Date(`${form.get("date")}T${form.get("time")}:00+07:00`).toISOString(),
          })
        ).id;
      });
      if (!ok) return;
    } else if (!lecturer) {
      const target = data.lessons.find((l) => l.status === "live");
      if (!target) {
        setError("Belum ada kelas demo yang berlangsung.");
        return;
      }
      id = target.id;
    } else {
      id = `kelas-${crypto.randomUUID().slice(0, 8)}`;
      const cid = selected || courses[0]?.id || "aljabar";
      const lesson: Lesson = {
        id,
        courseId: cid,
        title: String(form.get("title")).trim(),
        number:
          Math.max(0, ...data.lessons.filter((s) => s.courseId === cid).map((s) => s.number)) + 1,
        date: String(form.get("date")),
        time: String(form.get("time")),
        status: "upcoming",
        duration: "90 menit",
      };
      await update((d) => ({ ...d, lessons: [...d.lessons, lesson] }));
    }
    setOpen(false);
    notify(lecturer ? "Sesi dibuat." : "Berhasil bergabung.");
    router.push(`/session/${id}`);
  }
  return (
    <>
      <button className="button primary" onClick={() => setOpen(true)}>
        {lecturer ? <Plus size={16} /> : <LogIn size={16} />}{" "}
        {lecturer ? "Buat sesi" : "Gabung kelas"}
      </button>
      <Modal
        open={open}
        title={lecturer ? "Buat sesi" : "Gabung kelas"}
        onClose={() => setOpen(false)}
      >
        <form className="form-stack" onSubmit={submit}>
          {lecturer ? (
            <>
              <label>
                Mata kuliah
                <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {liveMode && <option value="">+ Mata kuliah baru</option>}
                </select>
              </label>
              {liveMode && !selected && (
                <>
                  <label>
                    Nama mata kuliah
                    <input name="course_name" minLength={2} maxLength={120} required />
                  </label>
                  <div className="form-row">
                    <label>
                      Kode mata kuliah
                      <input name="course_code" maxLength={30} />
                    </label>
                    <label>
                      Hari kuliah
                      <input name="days" placeholder="Senin, Kamis" maxLength={80} />
                    </label>
                  </div>
                  <label>
                    Jam kuliah
                    <input name="schedule_time" placeholder="09:00–10:30" maxLength={40} />
                  </label>
                </>
              )}
              <label>
                Topik pertemuan
                <input
                  name="title"
                  placeholder="Nilai eigen"
                  minLength={2}
                  maxLength={160}
                  required
                  autoFocus
                />
              </label>
              <div className="form-row">
                <label>
                  Tanggal
                  <input
                    type="date"
                    name="date"
                    defaultValue={
                      liveMode
                        ? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
                        : demoToday
                    }
                    required
                  />
                </label>
                <label>
                  Waktu
                  <input type="time" name="time" defaultValue={demoTime} required />
                </label>
              </div>
            </>
          ) : (
            <label>
              Kode kelas
              <input
                name="code"
                placeholder={liveMode ? "Kode dari dosen" : "Kode kelas demo"}
                autoComplete="off"
                autoCapitalize="characters"
                minLength={liveMode ? 6 : 1}
                maxLength={12}
                required
                autoFocus
              />
            </label>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={pending}>
            {pending ? "Memproses…" : lecturer ? "Buat sesi kelas" : "Gabung"}
            <ArrowRight size={16} />
          </button>
        </form>
      </Modal>
    </>
  );
}
