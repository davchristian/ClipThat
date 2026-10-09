"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bookmark, Link2, LoaderCircle, Play, Square } from "lucide-react";
import { Empty, Modal } from "@/components/ui";
import { dateLabel, seconds } from "@/lib/format";
import { SavedDetail } from "@/features/saved/saved-detail";
import { useSession } from "./use-session";
import { TranscriptPanel } from "./transcript-panel";
import { NotesPanel } from "./notes-panel";
import { QuestionsPanel } from "./questions-panel";
import { MaterialsPanel } from "./learning-resources";
import { PhotoDialog } from "./photo-dialog";
import { CapturePreview } from "./capture-preview";

const primaryTabs = [
  { id: "transcript", label: "Transkrip" },
  { id: "notes", label: "Catatan" },
  { id: "questions", label: "Pertanyaan" },
  { id: "materials", label: "Materi" },
];
const allowedTabs = primaryTabs.map((t) => t.id);

export function SessionView({ id }: { id: string }) {
  const query = useSearchParams().get("tab");
  const session = useSession(id);
  const { ready, lesson, lecturer, course, saved, update, notify } = session;
  const [detail, setDetail] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [end, setEnd] = useState(false);
  const tabs = useRef<HTMLDivElement>(null);
  const currentTab =
    query === "graph"
      ? "materials"
      : query && allowedTabs.includes(query)
        ? query
        : lesson?.status === "done"
          ? "notes"
          : "transcript";
  function changeTab(tab: string) {
    window.history.replaceState(null, "", `?tab=${tab}`);
    requestAnimationFrame(() => tabs.current?.scrollIntoView({ block: "start" }));
  }
  if (!ready)
    return (
      <div className="processing">
        <LoaderCircle size={24} />
        <span>Memuat kelas…</span>
      </div>
    );
  if (!lesson)
    return (
      <Empty
        title="Kelas tidak tersedia"
        action={
          <Link className="button secondary" href="/">
            Kembali ke kelas
          </Link>
        }
      />
    );
  const upcoming = lesson.status === "upcoming";
  const live = lesson.status === "live";
  const captureVisible = !!session.pendingCapture;
  function focusCapture() {
    requestAnimationFrame(() =>
      document.getElementById("capture-trigger")?.focus({ preventScroll: true }),
    );
  }
  return (
    <div className={`classroom ${captureVisible ? "preview-open" : ""}`}>
      <Link className="back-link" href={`/classes/${course.id}`}>
        <ArrowLeft size={15} />
        {course.name}
      </Link>
      <div className="page-heading session-heading">
        <div>
          <h1>{lesson.title}</h1>
          <p className="session-meta">
            Pertemuan {lesson.number} · {dateLabel(lesson.date)}
            {live && (
              <span className="badge live">
                <span className="status-dot" />
                Live
              </span>
            )}
          </p>
        </div>
        <div className="session-actions">
          {lecturer && (
            <button
              className="button secondary small"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lesson.code);
                  notify("Kode disalin.");
                } catch {
                  notify(`Kode: ${lesson.code}`);
                }
              }}
            >
              <Link2 size={15} />
              {lesson.code}
            </button>
          )}
          {lecturer && live && (
            <button className="button secondary small" onClick={() => setEnd(true)}>
              <Square size={13} />
              Akhiri
            </button>
          )}
          {lecturer && upcoming && (
            <button
              className="button primary"
              onClick={() => {
                update((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "live" } : l)),
                }));
                notify("Kelas demo dimulai.");
              }}
            >
              <Play size={15} />
              Mulai kelas
            </button>
          )}
        </div>
      </div>
      <div className="class-tabs" ref={tabs}>
        <div className="tabs" aria-label="Bagian kelas">
          {primaryTabs.map((t) => (
            <button
              key={t.id}
              className={currentTab === t.id ? "active" : ""}
              aria-current={currentTab === t.id ? "page" : undefined}
              onClick={() => changeTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {lesson.status === "processing" ? (
        <div className="processing" role="status">
          <LoaderCircle size={28} />
          <h2>Menyiapkan catatan…</h2>
        </div>
      ) : (
        <div className={`session-workspace ${captureVisible ? "has-preview" : ""}`}>
          <div className="session-content">
            {currentTab === "transcript" &&
              (upcoming ? (
                <section className="panel waiting-room">
                  <span className="badge">Terjadwal · {lesson.time}</span>
                  <h2>Kelas belum dimulai</h2>
                  <button className="button secondary" onClick={() => changeTab("materials")}>
                    Buka materi
                    <ArrowRight size={16} />
                  </button>
                </section>
              ) : (
                <TranscriptPanel
                  {...session}
                  onPhoto={() => setPhoto(true)}
                  onSaved={() => setSavedOpen(true)}
                  onAsk={() => changeTab("questions")}
                />
              ))}
            {currentTab === "notes" &&
              (upcoming ? (
                <Empty title="Catatan tersedia setelah kelas" />
              ) : (
                <NotesPanel
                  lesson={lesson}
                  saved={saved}
                  onSource={() => changeTab("transcript")}
                  onSaved={setDetail}
                />
              ))}
            {currentTab === "questions" && (
              <QuestionsPanel sessionId={id} teacher={course.teacher} />
            )}
            {currentTab === "materials" && (
              <MaterialsPanel
                lesson={lesson}
                onSource={() => changeTab("transcript")}
                focusMap={query === "graph"}
              />
            )}
          </div>
          {session.pendingCapture && (
            <CapturePreview
              key={session.pendingCapture.id}
              item={session.pendingCapture}
              onSave={(draft) => {
                session.saveCapture(draft);
                focusCapture();
              }}
              onDiscard={() => {
                session.discardCapture();
                focusCapture();
              }}
              onAsk={session.sendCaptureQuestion}
            />
          )}
        </div>
      )}
      {!lecturer && (
        <>
          <Modal
            open={savedOpen}
            title="Tersimpan di kelas ini"
            onClose={() => setSavedOpen(false)}
          >
            {saved.length ? (
              saved
                .slice()
                .reverse()
                .map((s) => (
                  <button
                    className="saved-preview"
                    key={s.id}
                    onClick={() => {
                      setSavedOpen(false);
                      setDetail(s.id);
                    }}
                  >
                    <Bookmark size={16} />
                    <strong>{s.title}</strong>
                    <small>{seconds(s.time)}</small>
                    <ArrowRight size={15} />
                  </button>
                ))
            ) : (
              <p className="muted py-4">Belum ada simpanan.</p>
            )}
          </Modal>
          <SavedDetail
            item={session.data.saved.find((s) => s.id === detail) || null}
            onClose={() => setDetail(null)}
          />
          {photo && <PhotoDialog sessionId={id} onClose={() => setPhoto(false)} />}
        </>
      )}
      <Modal
        open={end}
        title="Akhiri kelas?"
        subtitle="Catatan dan pertanyaan tetap tersedia."
        onClose={() => setEnd(false)}
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setEnd(false)}>
            Batal
          </button>
          <button
            className="button primary"
            onClick={() => {
              window.history.replaceState(null, "", `?tab=notes`);
              update((d) => ({
                ...d,
                lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "processing" } : l)),
              }));
              setEnd(false);
            }}
          >
            Selesaikan kelas
          </button>
        </div>
      </Modal>
    </div>
  );
}
