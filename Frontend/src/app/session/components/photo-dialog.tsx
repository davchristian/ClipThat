"use client";

import { liveMode } from "@/lib/app-mode";
import { useState } from "react";
import { Camera } from "lucide-react";
import { Modal } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import { readFile } from "@/lib/files";
import { seconds } from "@/lib/format";

export function PhotoDialog({
  sessionId,
  elapsed,
  onClose,
}: {
  sessionId: string;
  elapsed: number;
  onClose: () => void;
}) {
  const { update, notify, pending } = useApp();
  const [image, setImage] = useState("");
  const [timeInput, setTimeInput] = useState(seconds(elapsed));
  const [error, setError] = useState("");
  async function select(file?: File) {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > (liveMode ? 5 : 1) * 1024 * 1024
    ) {
      setError("JPG, PNG, atau WebP · maksimal 1 MB.");
      return;
    }
    try {
      setImage(await readFile(file));
    } catch {
      setError("Foto tidak bisa dibaca.");
    }
  }
  return (
    <Modal open title="Tambahkan foto" onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const match = /^(\d{1,3}):([0-5]\d)$/.exec(timeInput);
          const time = match ? Number(match[1]) * 60 + Number(match[2]) : -1;
          if (!image || time < 0 || time > elapsed) {
            setError(`Waktu harus antara 00:00–${seconds(elapsed)}.`);
            return;
          }
          const ok = await update((d) => ({
            ...d,
            saved: [
              ...d.saved,
              {
                id: crypto.randomUUID(),
                sessionId,
                type: "photo",
                title: `Foto papan · ${seconds(time)}`,
                text: `Foto pembahasan ${seconds(time)}.`,
                time,
                image,
                reviewed: false,
              },
            ],
          }));
          if (!ok) return;
          notify("Foto tersimpan.");
          onClose();
        }}
      >
        <label>
          Foto papan atau slide
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void select(e.target.files?.[0])}
          />
        </label>
        {image && <img className="photo-preview" src={image} alt="Pratinjau foto papan" />}
        <label>
          Waktu dalam transkrip
          <input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            placeholder={seconds(elapsed)}
            required
          />
          <span className="field-hint">
            Terisi otomatis dari waktu kelas. Kamu bisa menyesuaikannya.
          </span>
        </label>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <button className="button primary" disabled={!image || pending}>
          <Camera size={16} />
          Simpan foto
        </button>
      </form>
    </Modal>
  );
}
