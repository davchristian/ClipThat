"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Modal } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import { useContent } from "@/data/use-content";
import { liveMode } from "@/lib/app-mode";
import { api, RequestError } from "@/lib/api";

export function CourseJoin() {
  const { run, pending, notify } = useApp();
  const { courses } = useContent();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    let id = "";
    if (liveMode) {
      const ok = await run(async () => {
        try {
          id = (await api<{ id: string }>("courses/join", "POST", { code })).id;
        } catch (e) {
          const message =
            e instanceof RequestError && e.status === 404
              ? "Kode course tidak ditemukan. Periksa kode dari dosen."
              : e instanceof Error
                ? e.message
                : "Belum bisa bergabung.";
          setError(message);
          throw new Error(message);
        }
      });
      if (!ok) return;
    } else {
      id = courses.find((course) => course.joinCode === code)?.id || "";
      if (!id) {
        setError("Kode course tidak ditemukan. Coba CLIP000001 untuk demo.");
        return;
      }
    }
    setOpen(false);
    notify("Berhasil bergabung ke course.");
    router.push(`/classes/${id}`);
  }
  return (
    <>
      <button
        className="button primary"
        onClick={() => {
          setOpen(true);
          setError("");
          setCode("");
        }}
      >
        <LogIn size={16} /> Gabung course
      </button>
      <Modal
        open={open}
        title="Gabung course"
        onClose={() => {
          if (!pending) setOpen(false);
        }}
      >
        <form className="form-stack" onSubmit={submit}>
          <label>
            Kode course
            <input
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
              placeholder="Kode dari dosen"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              minLength={10}
              maxLength={10}
              pattern="[A-Za-z0-9]{10}"
              required
              autoFocus
            />
          </label>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={pending}>
            {pending ? "Menghubungkan…" : "Gabung"}
          </button>
        </form>
      </Modal>
    </>
  );
}
