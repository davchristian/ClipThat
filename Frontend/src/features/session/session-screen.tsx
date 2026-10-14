"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  FileText,
  Link2,
  Play,
  SearchX,
  Square,
} from "lucide-react";
import { Empty, Modal, NotesSkeleton, PageSkeleton } from "@/components/ui";
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
  const workspace = useRef<HTMLDivElement>(null);
  const currentTab =
    query === "graph"
      ? "materials"
      : query && allowedTabs.includes(query)
        ? query
        : lesson?.status === "done"
          ? "notes"
          : "transcript";
  useEffect(() => {
    if (!ready || !session.pendingCapture || currentTab !== "transcript") return;
    const container = workspace.current;
    const transcript = container?.querySelector<HTMLElement>(".transcript-panel");
    if (!container || !transcript) return;
    const resize = () =>
      container.style.setProperty("--transcript-panel-height", `${transcript.offsetHeight}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(transcript);
    return () => {
      observer.disconnect();
      container.style.removeProperty("--transcript-panel-height");
    };
  }, [ready, currentTab, session.pendingCapture?.id]);
  function changeTab(tab: string) {
    window.history.replaceState(null, "", `?tab=${tab}`);
    requestAnimationFrame(() => tabs.current?.scrollIntoView({ block: "start" }));
  }
  if (!ready) return <PageSkeleton label="Memuat kelas…" />;
  if (!lesson)
    return (
      <Empty
        icon={SearchX}
        title="Kelas tidak tersedia"
        text="Tautannya mungkin sudah lama, atau sesi ini sudah diarsipkan."
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
        <ArrowLeft size={16} />
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
                  notify(`Kode: ${lesson.code}`, { kind: "info" });
                }
              }}
            >
              <Link2 size={16} />
              {lesson.code}
            </button>
          )}
          {lecturer && live && (
            <button className="button secondary small" onClick={() => setEnd(true)}>
              <Square size={16} />
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
              <Play size={16} />
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
        <NotesSkeleton label="Menyiapkan catatan dari transkrip…" />
      ) : (
        <div
          ref={workspace}
          className={`session-workspace ${captureVisible ? "has-preview" : ""} ${currentTab === "transcript" && !upcoming ? "with-transcript" : ""}`}
        >
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
                <Empty
                  icon={FileText}
                  title="Catatan tersedia setelah kelas"
                  text="Catatan disusun dari transkrip begitu kelas selesai. Sementara itu, materi kelas sudah bisa dibuka."
                  action={
                    <button className="button secondary" onClick={() => changeTab("materials")}>
                      Buka materi
                      <ArrowRight size={16} />
                    </button>
                  }
                />
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
                    <ArrowRight size={16} />
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
