"use client";
import { Bookmark, FileText, LoaderCircle, MessageCircle, ScanLine, Trash2, X } from "lucide-react";
import type { SavedItem } from "@/lib/types";
import { seconds } from "@/lib/format";
export function CapturePreview({
  item,
  loading,
  pending,
  onSave,
  onDiscard,
  onChange,
  onAsk,
}: {
  item: SavedItem | null;
  loading: boolean;
  pending: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onChange: (text: string) => void;
  onAsk: (question: string) => void;
}) {
  return (
    <aside className="capture-preview" aria-label="Preview capture" aria-busy={loading}>
      <header>
        <span className="capture-preview-icon">
          <ScanLine size={22} />
        </span>
        <div>
          <h2>Preview capture</h2>
          <p>
            {item
              ? `${seconds(item.time)}–${seconds(item.end || item.time)}`
              : "Menyiapkan cuplikan…"}
          </p>
        </div>
        {!loading && (
          <button
            className="icon-button"
            aria-label="Tutup preview capture"
            disabled={pending}
            onClick={onDiscard}
          >
            <X size={18} />
          </button>
        )}
      </header>
      <div className="capture-preview-body" role="status">
        {loading ? (
          <div className="processing">
            <LoaderCircle size={24} />
            <p>Merangkum pembahasan…</p>
          </div>
        ) : (
          item && (
            <>
              <span className="capture-unsaved">
                <i />
                Belum disimpan
              </span>
              <section>
                <h3>Inti pembahasan</h3>
                <p className="capture-summary">{item.summary}</p>
              </section>
              <details className="capture-source">
                <summary>
                  <FileText size={17} /> Transkrip sumber
                </summary>
                <p>{item.text}</p>
              </details>
              <section className="capture-question">
                <h3>
                  <MessageCircle size={17} /> Saran pertanyaan
                </h3>
                <label className="sr-only" htmlFor="capture-question">
                  Edit saran pertanyaan
                </label>
                <textarea
                  id="capture-question"
                  value={item.draft || ""}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => onChange(e.target.value)}
                />
                <button
                  className="text-button"
                  onClick={() => onAsk(item.draft || "")}
                  disabled={!item.draft?.trim()}
                >
                  Tinjau pertanyaan
                </button>
              </section>
            </>
          )
        )}
      </div>
      <footer>
        <button
          className="button secondary capture-discard"
          aria-label="Buang preview capture"
          title="Buang preview"
          disabled={loading || pending}
          onClick={onDiscard}
        >
          <Trash2 size={19} />
        </button>
        <button className="button primary" disabled={!item || loading || pending} onClick={onSave}>
          {pending ? <LoaderCircle size={17} /> : <Bookmark size={17} />}{" "}
          {pending ? "Menyimpan…" : "Simpan capture"}
        </button>
      </footer>
    </aside>
  );
}
