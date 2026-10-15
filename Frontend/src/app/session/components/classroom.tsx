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
import { GraphPanel, MaterialsPanel } from "./learning-resources";
import { PhotoDialog } from "./photo-dialog";
import { PageClock } from "@/components/ui/page-clock";

const primaryTabs = [
  { id: "transcript", label: "Transkrip" },
  { id: "notes", label: "Ringkasan" },
  { id: "questions", label: "Pertanyaan" },
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
    query && allowedTabs.includes(query) && (query !== "notes" || lesson?.status === "done")
      ? query
      : lesson?.status === "done"
        ? "notes"
        : "transcript";
  function changeTab(tab: string) {
    window.history.replaceState(null, "", `?tab=${tab}`);
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
        <PageClock />
      </div>
      <div className="class-tabs">
        <div className="tabs" aria-label="Bagian kelas">
          {primaryTabs
            .filter((tab) => tab.id !== "notes" || lesson.status === "done")
            .map((t) => (
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
              <TranscriptPanel
                {...session}
                readOnly={!live}
                onPhoto={() => setPhoto(true)}
                onOpenSaved={setDetail}
                onAsk={() => changeTab("questions")}
              />
            ))}
          {currentTab === "notes" && lesson.status === "done" && (
            <NotesPanel
              lesson={lesson}
              saved={saved}
              onSource={() => changeTab("transcript")}
              onGraph={() => changeTab("graph")}
              onSaved={setDetail}
            />
          )}
          {currentTab === "questions" && <QuestionsPanel sessionId={id} />}
          {currentTab === "materials" && <MaterialsPanel lesson={lesson} />}
          {currentTab === "graph" && (
            <GraphPanel
              lesson={lesson}
              onSource={() => changeTab("transcript")}
              onMaterial={() => changeTab("materials")}
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
        subtitle="Catatan dan pertanyaan tetap tersedia. Agenda dari kelas langsung tersimpan."
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
