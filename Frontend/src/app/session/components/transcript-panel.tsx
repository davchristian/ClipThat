"use client";

import { Bookmark, Camera, MessageCircle, ScanLine } from "lucide-react";
import { seconds } from "@/lib/format";
import type { SavedItem, Segment } from "@/lib/types";

export function TranscriptPanel({
  segments,
  saved,
  lecturer,
  readOnly,
  bookmark,
  capture,
  onPhoto,
  onOpenSaved,
  onAsk,
}: {
  segments: Segment[];
  saved: SavedItem[];
  lecturer: boolean;
  readOnly: boolean;
  bookmark: (segment: Segment) => void;
  capture: () => void;
  onPhoto: () => void;
  onOpenSaved: (id: string) => void;
  onAsk: () => void;
}) {
  const photos = saved.filter((item) => item.type === "photo");
  const photoSegment = (time: number) =>
    segments.reduce(
      (nearest, segment) =>
        Math.abs(segment.time - time) < Math.abs(nearest.time - time) ? segment : nearest,
      segments[0],
    )?.id;
  return (
    <section className="transcript-panel">
      <div className="transcript-toolbar">
        <span>Transkrip</span>
      </div>
      <div className="transcript-content">
        {segments.map((segment) => {
          const marked = saved.some((s) => s.type === "bookmark" && s.time === segment.time);
          return (
            <article
              key={segment.id}
              className={`transcript-segment ${!lecturer && marked ? "marked" : ""}`}
            >
              <time>{seconds(segment.time)}</time>
              <div className="transcript-entry">
                <p>{segment.text}</p>
                {!lecturer &&
                  photos
                    .filter((photo) => photoSegment(photo.time) === segment.id)
                    .map((photo) => (
                      <button
                        className="transcript-photo"
                        key={photo.id}
                        onClick={() => onOpenSaved(photo.id)}
                      >
                        {photo.image && <img src={photo.image} alt="" />}
                        <span>
                          <Camera size={14} />
                          Foto kamu · {seconds(photo.time)}
                          <small>Lihat foto papan</small>
                        </span>
                      </button>
                    ))}
              </div>
              {!lecturer && !readOnly && (
                <button
                  className={`icon-button bookmark-button ${marked ? "selected" : ""}`}
                  aria-label={`${marked ? "Hapus penanda" : "Simpan bagian"} ${seconds(segment.time)}`}
                  title={marked ? "Hapus penanda" : "Simpan untuk review"}
                  aria-pressed={marked}
                  onClick={() => bookmark(segment)}
                >
                  <Bookmark size={18} fill={marked ? "currentColor" : "none"} />
                </button>
              )}
              {!lecturer && readOnly && marked && (
                <span
                  className="transcript-marker"
                  aria-label={`Ditandai saat kelas ${seconds(segment.time)}`}
                >
                  <Bookmark size={18} fill="currentColor" />
                </span>
              )}
            </article>
          );
        })}
      </div>
      {!lecturer && !readOnly && (
        <div className="capture-bar">
          <button className="button primary" onClick={capture}>
            <ScanLine size={17} />
            Capture 90 detik
          </button>
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
      )}
    </section>
  );
}
