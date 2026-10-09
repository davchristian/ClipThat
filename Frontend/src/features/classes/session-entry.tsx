"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import type { Lesson } from "@/lib/types";

export function SessionEntry({ create = false }: { create?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { data, update, notify } = useApp();
  const router = useRouter();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (create) {
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
        code: `ALG${id.slice(-5).toUpperCase()}`,
        duration: "90 menit",
      };
      update((d) => ({ ...d, lessons: [...d.lessons, lesson] }));
      setOpen(false);
      notify("Sesi dibuat.");
      router.push(`/session/${id}`);
      return;
    }
    const found = data.lessons.find(
      (s) => s.code.toLowerCase() === String(form.get("code")).trim().toLowerCase(),
    );
    if (!found) {
      setError("Kode tidak ditemukan. Coba ALG05.");
      return;
    }
    setOpen(false);
    router.push(`/session/${found.id}`);
  }
  return (
    <>
      <button
        className="button primary"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Plus size={16} />
        {create ? "Buat sesi" : "Gabung kelas"}
      </button>
      <Modal
        open={open}
        title={create ? "Buat sesi" : "Gabung kelas"}
        onClose={() => setOpen(false)}
      >
        <form className="form-stack" onSubmit={submit}>
          {create ? (
            <>
              <label>
                Topik pertemuan
                <input name="title" placeholder="Nilai eigen" maxLength={90} required autoFocus />
              </label>
              <div className="form-row">
                <label>
                  Tanggal
                  <input type="date" name="date" defaultValue="2026-10-08" required />
                </label>
                <label>
                  Waktu
                  <input type="time" name="time" defaultValue="09:00" required />
                </label>
              </div>
            </>
          ) : (
            <label>
              Kode kelas
              <input
                name="code"
                placeholder="ALG05"
                autoComplete="off"
                maxLength={12}
                autoFocus
                required
              />
              <span className="field-hint">Kode contoh: ALG05</span>
            </label>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary">
            {create ? "Buat sesi kelas" : "Gabung kelas"}
            <ArrowRight size={16} />
          </button>
        </form>
      </Modal>
    </>
  );
}
