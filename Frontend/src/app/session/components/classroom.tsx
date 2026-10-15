"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, Maximize, Minimize, Play, Square } from "lucide-react";
import { Breadcrumbs, Empty, Modal } from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { SavedDetail } from "@/components/saved-detail";
import { useSession } from "./use-session";
import { TranscriptPanel } from "./transcript-panel";
import { NotesPanel } from "./notes-panel";
import { QuestionsPanel } from "./questions-panel";
import { MaterialsPanel } from "./learning-resources";
import { CapturePreview } from "./capture-preview";
import { Microphone } from "@/features/live/microphone";
import { liveMode } from "@/lib/app-mode";
import { PhotoDialog } from "./photo-dialog";
import { PageClock } from "@/components/ui/page-clock";

const primaryTabs = [
  { id: "transcript", label: "Transkrip" },
  { id: "notes", label: "Catatan" },
  { id: "questions", label: "Pertanyaan" },
  { id: "materials", label: "Materi" },
];
const allowedTabs = [...primaryTabs.map((t) => t.id), "graph", "materials"];

export function SessionView({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("tab");
  const savedQuery = searchParams.get("saved");
  const session = useSession(id);
  const { ready, lesson, lecturer, course, saved, update, notify } = session;
  const [detail, setDetail] = useState<string | null>(savedQuery);
  const [photo, setPhoto] = useState(false);
  const [end, setEnd] = useState(false);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [questionDraft, setQuestionDraft] = useState("");
  const sourceQuery = searchParams.get("source");
  useEffect(() => {
    const source = sourceQuery || window.location.hash.replace(/^#segment-/, "");
    if (!source || !ready || query !== "transcript") return;
    const frame = requestAnimationFrame(() => {
      const element = [
        ...document.querySelectorAll<HTMLElement>(`#${CSS.escape(`segment-${source}`)}`),
      ].find((node) => node.getClientRects().length > 0);
      element?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [sourceQuery, ready, query, session.segments.length]);
  const classroomRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => setFocused(document.fullscreenElement === classroomRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function toggleFocus() {
    try {
      if (document.fullscreenElement === classroomRef.current) {
        await document.exitFullscreen();
      } else if (classroomRef.current?.requestFullscreen) {
        await classroomRef.current.requestFullscreen();
      } else {
        notify("Mode layar penuh belum didukung browser ini.");
      }
    } catch {
      notify("Mode layar penuh tidak bisa dibuka. Coba klik Focus Mode lagi.");
    }
  }
  const currentTab =
    query === "graph"
      ? "materials"
      : query && allowedTabs.includes(query)
        ? query
        : lesson?.status === "done"
          ? "notes"
          : "transcript";
  function changeTab(tab: string) {
    window.history.replaceState(
      null,
      "",
      tab === "graph" ? "?tab=materials&view=graph" : `?tab=${tab}`,
    );
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
  return (
    <div className="classroom" ref={classroomRef}>
      <Breadcrumbs
        items={[
          { label: "Course", href: "/classes" },
          { label: course.name, href: `/classes/${course.id}` },
          { label: lesson.title },
        ]}
      />
      <div className="page-heading session-heading">
        <div className="page-heading-title session-title">
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
        <div className="page-heading-actions session-actions">
          {lecturer && lesson.status === "failed" && (
            <button
              className="button secondary"
              disabled={session.pending}
              onClick={() =>
                void update((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "processing" } : l)),
                }))
              }
            >
              Coba proses lagi
            </button>
          )}
          {lecturer && live && liveMode && lesson.startedAt && (
            <Microphone
              sessionId={id}
              startedAt={lesson.startedAt}
              onChange={setRecordingBusy}
              onUploaded={session.reload}
            />
          )}
          {lecturer && live && lesson.code && (
            <button
              className="button secondary small"
              onClick={() => {
                void navigator.clipboard
                  .writeText(lesson.code!)
                  .then(() => notify("Kode kelas disalin."));
              }}
            >
              Kode: {lesson.code}
            </button>
          )}
          {lecturer && live && (
            <button
              className="button secondary small"
              disabled={recordingBusy || session.pending}
              onClick={() => setEnd(true)}
            >
              <Square size={13} />
              Akhiri
            </button>
          )}
          {lecturer && upcoming && (
            <button
              className="button primary"
              disabled={session.pending}
              onClick={async () => {
                const ok = await update((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "live" } : l)),
                }));
                if (ok) notify(liveMode ? "Kelas dimulai." : "Kelas demo dimulai.");
              }}
            >
              <Play size={15} />
              Mulai kelas
            </button>
          )}
        </div>
        <PageClock />
      </div>
      <div className="class-tabs">
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
        <button
          type="button"
          className="text-button focus-mode-button"
          onClick={toggleFocus}
          aria-label={focused ? "Keluar Focus Mode" : "Focus Mode"}
          aria-pressed={focused}
          title={focused ? "Keluar Focus Mode (Esc)" : "Focus Mode"}
        >
          {focused ? <Minimize size={18} /> : <Maximize size={18} />}
          <span>{focused ? "Keluar Focus Mode" : "Focus Mode"}</span>
        </button>
      </div>
      {lesson.status === "processing" ? (
        <div className="processing" role="status">
          <LoaderCircle size={28} />
          <h2>Menyiapkan catatan…</h2>
        </div>
      ) : (
        <>
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
              <div
                className={`session-workspace ${session.preview || session.previewLoading ? "has-preview" : ""}`}
              >
                <TranscriptPanel
                  {...session}
                  readOnly={!live}
                  previewRange={
                    session.preview
                      ? {
                          start: session.preview.time,
                          end: session.preview.end || session.preview.time,
                        }
                      : undefined
                  }
                  captureBusy={session.previewLoading || !!session.preview || session.pending}
                  captureLoading={session.previewLoading}
                  onPhoto={() => setPhoto(true)}
                  onOpenSaved={setDetail}
                  onAsk={() => changeTab("questions")}
                />
                {(session.preview || session.previewLoading) && (
                  <CapturePreview
                    item={session.preview}
                    loading={session.previewLoading}
                    pending={session.pending}
                    onSave={() => void session.saveCapture()}
                    onDiscard={session.discardCapture}
                    onChange={(text) => session.setPreview((p) => (p ? { ...p, draft: text } : p))}
                    onAsk={(text) => {
                      setQuestionDraft(text);
                      changeTab("questions");
                    }}
                  />
                )}
              </div>
            ))}
          {currentTab === "notes" && (
            <NotesPanel
              lesson={lesson}
              saved={saved}
              onSource={() => changeTab("transcript")}
              onGraph={() => changeTab("graph")}
              onSaved={setDetail}
            />
          )}
          {currentTab === "questions" && <QuestionsPanel sessionId={id} draft={questionDraft} />}
          {currentTab === "materials" && (
            <MaterialsPanel
              lesson={lesson}
              showGraph={query === "graph" || searchParams.get("view") === "graph"}
              onSource={(sourceId) =>
                window.history.replaceState(
                  null,
                  "",
                  `?tab=transcript${sourceId ? `&source=${encodeURIComponent(sourceId)}` : ""}`,
                )
              }
            />
          )}
        </>
      )}
      {!lecturer && (
        <>
          <SavedDetail
            item={session.data.saved.find((s) => s.id === detail) || null}
            onClose={() => {
              setDetail(null);
              if (savedQuery) window.history.replaceState(null, "", `?tab=${currentTab}`);
            }}
          />
          {photo && live && (
            <PhotoDialog sessionId={id} elapsed={session.elapsed} onClose={() => setPhoto(false)} />
          )}
        </>
      )}
      <Modal
        open={end}
        title="Akhiri kelas?"
        subtitle="Catatan akan diproses. Agenda dari kelas perlu dikonfirmasi mahasiswa."
        onClose={() => setEnd(false)}
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setEnd(false)}>
            Batal
          </button>
          <button
            className="button primary"
            disabled={session.pending || recordingBusy}
            onClick={async () => {
              window.history.replaceState(null, "", `?tab=notes`);
              if (
                await update((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) => (l.id === id ? { ...l, status: "processing" } : l)),
                }))
              )
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
