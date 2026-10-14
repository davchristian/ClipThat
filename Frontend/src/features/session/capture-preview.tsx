"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, FileText, MessageCircle, ScanLine, Send, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui";
import { seconds } from "@/lib/format";
import type { SavedItem } from "@/lib/types";

export function CapturePreview({
  item,
  onSave,
  onDiscard,
  onAsk,
}: {
  item: SavedItem;
  onSave: (draft: string) => void | Promise<void>;
  onDiscard: () => void;
  onAsk: (text: string) => void | Promise<void>;
}) {
  const [compact, setCompact] = useState(false);
  const [draft, setDraft] = useState(item.draft || "");
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const discard = () => {
    if (!busy) onDiscard();
  };
  const heading = useRef<HTMLHeadingElement>(null);
  const range = `${seconds(item.time)}–${seconds(item.end ?? item.time)}`;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1200px), (max-height: 700px)");
    function resize() {
      setCompact(media.matches);
    }
    resize();
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (!compact) heading.current?.focus({ preventScroll: true });
  }, [compact]);

  const content = (
    <>
      <div className="capture-preview-body">
        <span className="capture-unsaved">Belum disimpan</span>
        <section className="capture-summary">
          <h3>Inti pembahasan</h3>
          <p>{item.summary || item.text}</p>
        </section>
        <details className="detail-section capture-source">
          <summary>
            <FileText size={16} aria-hidden="true" />
            Transkrip sumber
          </summary>
          <p>{item.text}</p>
        </details>
        <section className="capture-question">
          <h3>
            <MessageCircle size={16} aria-hidden="true" />
            Saran pertanyaan
          </h3>
          {editing && !sent ? (
            <form
              className="capture-question-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                setBusy(true);
                setError("");
                try {
                  await onAsk(draft);
                  setSent(true);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Pertanyaan belum terkirim.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <textarea
                aria-label="Draf pertanyaan capture"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={1000}
                autoFocus
                required
              />
              <button className="button secondary small" disabled={!draft.trim() || busy}>
                <Send size={14} aria-hidden="true" />
                Kirim anonim
              </button>
            </form>
          ) : (
            <>
              <p>{draft}</p>
              {sent ? (
                <span className="capture-question-sent" role="status">
                  <Check size={16} aria-hidden="true" />
                  Pertanyaan terkirim
                </span>
              ) : (
                <button className="text-button" onClick={() => setEditing(true)}>
                  Edit dan kirim
                </button>
              )}
            </>
          )}
        </section>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="capture-preview-actions">
        <button
          className="icon-button large capture-discard"
          aria-label="Buang capture"
          title="Buang capture"
          onClick={discard}
          disabled={busy}
        >
          <Trash2 size={20} aria-hidden="true" />
        </button>
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onSave(draft);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Capture belum disimpan.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Bookmark size={15} aria-hidden="true" />
          Simpan capture
        </button>
      </div>
    </>
  );

  if (compact) {
    return (
      <Modal
        open
        wide
        sheet
        dismissible={!busy}
        title="Preview capture"
        subtitle={`${range} · 90 detik terakhir`}
        onClose={discard}
      >
        <div id="capture-preview" className="capture-preview-compact">
          {content}
        </div>
      </Modal>
    );
  }
  return (
    <aside
      id="capture-preview"
      className="capture-preview"
      aria-labelledby="capture-preview-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          discard();
        }
      }}
    >
      <div className="capture-preview-heading">
        <span className="capture-preview-icon" aria-hidden="true">
          <ScanLine size={20} />
        </span>
        <div>
          <h2 id="capture-preview-title" ref={heading} tabIndex={-1}>
            Preview capture
          </h2>
          <p>{range} · 90 detik terakhir</p>
        </div>
        <button
          className="icon-button"
          aria-label="Buang dan tutup preview"
          onClick={discard}
          disabled={busy}
        >
          <X size={18} />
        </button>
      </div>
      {content}
    </aside>
  );
}
