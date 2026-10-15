"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { liveMode } from "@/lib/app-mode";
import Link from "next/link";
import { ArrowRight, Check, Send, Trash2 } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { seconds } from "@/lib/format";
import type { SavedItem } from "@/lib/types";

export function SavedDetail({ item, onClose }: { item: SavedItem | null; onClose: () => void }) {
  const { data, update, notify, pending } = useApp();
  const [photo, setPhoto] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setDraft(null);
    if (liveMode && item?.type === "photo")
      void api<{ signedUrl: string }>(`files/photos/${item.id}`)
        .then((v) => {
          if (!cancelled) setPhoto({ id: item.id, url: v.signedUrl });
        })
        .catch(() => notify("Foto belum dapat dimuat."));
    return () => {
      cancelled = true;
    };
  }, [item?.id, notify]);
  const [draft, setDraft] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const exists = item && data.lessons.some((s) => s.id === item.sessionId);
  const editable = !!item;
  function close() {
    setDraft(null);
    setDeleting(false);
    onClose();
  }
  return (
    <Modal
      open={!!item}
      title={deleting ? "Hapus simpanan?" : item?.title || "Tersimpan"}
      subtitle={
        item && !deleting
          ? `${seconds(item.time)}${item.end ? ` – ${seconds(item.end)}` : ""} · Pribadi`
          : undefined
      }
      onClose={close}
    >
      {item &&
        (deleting && editable ? (
          <div className="dialog-actions">
            <button className="button secondary" onClick={() => setDeleting(false)}>
              Batal
            </button>
            <button
              className="button danger"
              disabled={pending}
              onClick={async () => {
                if (
                  !(await update((d) => ({ ...d, saved: d.saved.filter((s) => s.id !== item.id) })))
                )
                  return;
                notify("Simpanan dihapus.");
                close();
              }}
            >
              Hapus
            </button>
          </div>
        ) : (
          <>
            {(item.image || photo?.id === item.id) && (
              <img
                className="photo-preview"
                src={photo?.id === item.id ? photo.url : item.image}
                alt={item.title}
              />
            )}
            <p className="capture-excerpt">{item.summary || item.text}</p>
            {item.summary && (
              <details className="detail-section">
                <summary>Transkrip sumber</summary>
                <p className="capture-excerpt">{item.text}</p>
              </details>
            )}
            {item.type === "capture" && editable && (
              <details className="detail-section">
                <summary>Ajukan pertanyaan</summary>
                <textarea
                  aria-label="Draf pertanyaan capture"
                  value={draft ?? item.draft ?? ""}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={1000}
                />
                <button
                  className="button secondary small mt-3"
                  disabled={pending || !exists || (draft ?? item.draft ?? "").trim().length < 3}
                  onClick={async () => {
                    const text = (draft ?? item.draft ?? "").trim();
                    if (!text) return;
                    const ok = await update((d) => ({
                      ...d,
                      questions: [
                        ...d.questions,
                        {
                          id: crypto.randomUUID(),
                          sessionId: item.sessionId,
                          text,
                          votes: 0,
                          supported: false,
                          time: seconds(item.time),
                        },
                      ],
                    }));
                    if (!ok) return;
                    notify("Pertanyaan terkirim.");
                    close();
                  }}
                >
                  <Send size={14} />
                  Kirim anonim
                </button>
              </details>
            )}
            <div className="dialog-actions">
              {exists && (
                <Link
                  href={`/session/${item.sessionId}?tab=transcript`}
                  className="text-button mr-auto"
                  onClick={close}
                >
                  Buka kelas
                  <ArrowRight size={14} />
                </Link>
              )}
              {editable && (
                <>
                  <button
                    className="icon-button"
                    aria-label="Hapus bagian pribadi"
                    onClick={() => setDeleting(true)}
                  >
                    <Trash2 size={17} />
                  </button>
                  <button
                    className="button primary small"
                    disabled={pending}
                    onClick={async () => {
                      const ok = await update((d) => ({
                        ...d,
                        saved: d.saved.map((s) =>
                          s.id === item.id ? { ...s, reviewed: !s.reviewed } : s,
                        ),
                      }));
                      if (!ok) return;
                      notify(item.reviewed ? "Masuk daftar review." : "Ditandai sudah paham.");
                      close();
                    }}
                  >
                    <Check size={15} />
                    {item.reviewed ? "Review lagi" : "Sudah paham"}
                  </button>
                </>
              )}
            </div>
          </>
        ))}
    </Modal>
  );
}
