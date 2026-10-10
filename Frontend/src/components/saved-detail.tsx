"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Send, Trash2 } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { seconds } from "@/lib/format";
import type { SavedItem } from "@/lib/types";

export function SavedDetail({ item, onClose }: { item: SavedItem | null; onClose: () => void }) {
  const { data, update, notify } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const exists = item && data.lessons.some((s) => s.id === item.sessionId);
  const editable =
    item && data.lessons.some((lesson) => lesson.id === item.sessionId && lesson.status === "live");
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
              onClick={() => {
                update((d) => ({ ...d, saved: d.saved.filter((s) => s.id !== item.id) }));
                notify("Simpanan dihapus.");
                close();
              }}
            >
              Hapus
            </button>
          </div>
        ) : (
          <>
            {item.image && <img className="photo-preview" src={item.image} alt={item.title} />}
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
                  disabled={!exists || !(draft ?? item.draft ?? "").trim()}
                  onClick={() => {
                    const text = (draft ?? item.draft ?? "").trim();
                    if (!text) return;
                    update((d) => ({
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
                    notify("Pertanyaan terkirim.");
                    close();
                  }}
                >
                  <Send size={14} />
                  Kirim anonim
                </button>
              </details>
            )}
            {item.type === "capture" && !editable && item.draft && (
              <details className="detail-section">
                <summary>Pertanyaan dari capture</summary>
                <p className="capture-excerpt">{item.draft}</p>
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
                    onClick={() => {
                      update((d) => ({
                        ...d,
                        saved: d.saved.map((s) =>
                          s.id === item.id ? { ...s, reviewed: !s.reviewed } : s,
                        ),
                      }));
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
