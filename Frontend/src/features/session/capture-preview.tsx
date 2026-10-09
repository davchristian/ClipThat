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
  onSave: (draft: string) => void;
  onDiscard: () => void;
  onAsk: (text: string) => void;
}) {
  const [compact, setCompact] = useState(false);
  const [draft, setDraft] = useState(item.draft || "");
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const range = `${seconds(item.time)}–${seconds(item.end ?? item.time)}`;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1280px), (max-height: 700px)");
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
            <FileText size={15} aria-hidden="true" />
            Transkrip sumber
          </summary>
          <p>{item.text}</p>
        </details>
        <section className="capture-question">
          <h3>
            <MessageCircle size={15} aria-hidden="true" />
            Saran pertanyaan
          </h3>
          {editing && !sent ? (
            <form
              className="capture-question-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                onAsk(draft);
                setSent(true);
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
              <button className="button secondary small" disabled={!draft.trim()}>
                <Send size={14} aria-hidden="true" />
                Kirim anonim
              </button>
            </form>
          ) : (
            <>
              <p>{draft}</p>
              {sent ? (
                <span className="capture-question-sent" role="status">
                  <Check size={14} aria-hidden="true" />
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
      </div>
      <div className="capture-preview-actions">
        <button
          className="icon-button capture-discard"
          aria-label="Buang capture"
          title="Buang capture"
          onClick={onDiscard}
        >
          <Trash2 size={19} aria-hidden="true" />
        </button>
        <button className="button primary" onClick={() => onSave(draft)}>
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
        title="Preview capture"
        subtitle={`${range} · 90 detik terakhir`}
        onClose={onDiscard}
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
          onDiscard();
        }
      }}
    >
      <div className="capture-preview-heading">
        <span className="capture-preview-icon" aria-hidden="true">
          <ScanLine size={19} />
        </span>
        <div>
          <h2 id="capture-preview-title" ref={heading} tabIndex={-1}>
            Preview capture
          </h2>
          <p>{range} · 90 detik terakhir</p>
        </div>
        <button className="icon-button" aria-label="Buang dan tutup preview" onClick={onDiscard}>
          <X size={18} />
        </button>
      </div>
      {content}
    </aside>
  );
}
