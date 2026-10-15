"use client";

import { Bookmark, Camera, CircleHelp, MessageCircle, ScanLine, LoaderCircle } from "lucide-react";
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
  previewRange,
  captureBusy = false,
  captureLoading = false,
}: {
  segments: Segment[];
  saved: SavedItem[];
  lecturer: boolean;
  readOnly: boolean;
  bookmark: (segment: Segment, label?: "Bingung" | "Review nanti") => void;
  capture: () => void;
  onPhoto: () => void;
  onOpenSaved: (id: string) => void;
  onAsk: () => void;
  previewRange?: { start: number; end: number };
  captureBusy?: boolean;
  captureLoading?: boolean;
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
        {!segments.length && (
          <p className="empty-transcript">Transkrip akan muncul saat dosen mulai merekam.</p>
        )}
        {segments.map((segment) => {
          const marked = saved.some((s) => s.type === "bookmark" && s.time === segment.time);
          return (
            <article
              key={segment.id}
              id={`segment-${segment.id}`}
              className={`transcript-segment ${!lecturer && marked ? "marked" : ""} ${previewRange && segment.time < previewRange.end && (segment.end ?? segment.time + 45) > previewRange.start ? "capture-highlight" : ""}`}
            >
              <time>{seconds(segment.time)}</time>
              <div className="transcript-entry">
                <p>{segment.text}</p>
                {!lecturer && !readOnly && (
                  <button
                    className="text-button confusion-marker"
                    aria-label={`Bingung pada ${seconds(segment.time)}`}
                    onClick={() => bookmark(segment, "Bingung")}
                  >
                    <CircleHelp size={13} /> Bingung
                  </button>
                )}
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
          <div className="capture-action">
            <button
              className="button primary"
              onClick={capture}
              disabled={captureBusy || !segments.length}
            >
              {captureLoading ? <LoaderCircle size={17} /> : <ScanLine size={17} />}
              Capture 90 detik
            </button>
            <small>Lihat preview sebelum menyimpan</small>
          </div>
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
