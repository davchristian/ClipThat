"use client";

import { useLayoutEffect, useRef } from "react";
import { Bookmark, Camera, MessageCircle, ScanLine } from "lucide-react";
import { seconds } from "@/lib/format";
import type { SavedItem, Segment } from "@/lib/types";

export function TranscriptPanel({
  segments,
  saved,
  lecturer,
  bookmark,
  capture,
  pendingCapture,
  onPhoto,
  onSaved,
  onAsk,
  captureBusy = false,
}: {
  segments: Segment[];
  saved: SavedItem[];
  lecturer: boolean;
  bookmark: (segment: Segment) => void;
  capture: () => void;
  pendingCapture: SavedItem | null;
  onPhoto: () => void;
  onSaved: () => void;
  onAsk: () => void;
  captureBusy?: boolean;
}) {
  const content = useRef<HTMLDivElement>(null);
  const captureId = pendingCapture?.id;
  useLayoutEffect(() => {
    const box = content.current;
    const first = box?.querySelector<HTMLElement>(".in-capture");
    if (!box || !first) return;
    const view = box.getBoundingClientRect();
    const offset = first.getBoundingClientRect().top - view.top;
    if (offset >= 0 && offset <= view.height / 2) return;
    box.scrollTop += offset - 12;
  }, [captureId]);
  return (
    <section className="transcript-panel">
      <div className="transcript-toolbar">
        <span>Transkrip</span>
        {!lecturer && (
          <button className="text-button" onClick={onSaved}>
            <Bookmark size={16} />
            Tersimpan ({saved.length})
          </button>
        )}
      </div>
      <div className="transcript-content" ref={content}>
        {segments.map((segment) => {
          const marked = saved.some((s) => s.type === "bookmark" && s.time === segment.time);
          const inCapture =
            pendingCapture &&
            segment.time >= pendingCapture.time &&
            segment.time <= (pendingCapture.end ?? pendingCapture.time);
          return (
            <article
              key={segment.id}
              id={`source-${segment.id}`}
              className={`transcript-segment ${!lecturer && marked ? "marked" : ""} ${inCapture ? "in-capture" : ""}`}
            >
              <time>{seconds(segment.time)}</time>
              <p>{segment.text}</p>
              {!lecturer && (
                <button
                  className={`icon-button small bookmark-button ${marked ? "selected" : ""}`}
                  aria-label={`${marked ? "Hapus penanda" : "Simpan bagian"} ${seconds(segment.time)}`}
                  title={marked ? "Hapus penanda" : "Simpan untuk review"}
                  aria-pressed={marked}
                  onClick={() => bookmark(segment)}
                >
                  <Bookmark size={18} fill={marked ? "currentColor" : "none"} />
                </button>
              )}
            </article>
          );
        })}
      </div>
      {!lecturer && (
        <div className="capture-bar">
          <div className="capture-action">
            <button
              id="capture-trigger"
              className="button primary"
              onClick={capture}
              disabled={!!pendingCapture || captureBusy}
              aria-expanded={!!pendingCapture}
              aria-controls={pendingCapture ? "capture-preview" : undefined}
            >
              <ScanLine size={17} />
              {captureBusy ? "Memproses…" : "Capture 90 detik"}
            </button>
            <small>Lihat preview sebelum menyimpan</small>
          </div>
          <div className="capture-tools">
            <button className="button secondary" onClick={onAsk}>
              <MessageCircle size={16} />
              Tanya
            </button>
            <button
              className="icon-button"
              aria-label="Tambahkan foto"
              title="Tambahkan foto"
              onClick={onPhoto}
            >
              <Camera size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
