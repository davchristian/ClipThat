"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, HelpCircle, LoaderCircle, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { BackendDetail, Boot, CaptureDraft } from "@/lib/backend-types";
import type { SavedItem, Segment } from "@/lib/types";
import { seconds } from "@/lib/format";
import { useApp } from "@/state/app-provider";
import { Modal, Empty } from "@/components/ui";
import { TranscriptPanel } from "@/features/session/transcript-panel";
import { CapturePreview } from "@/features/session/capture-preview";
import { LiveMaterials } from "./materials";
import { Microphone } from "./microphone";

const tabs = [
  { id: "transcript", label: "Transkrip" },
  { id: "notes", label: "Catatan" },
  { id: "questions", label: "Pertanyaan" },
  { id: "materials", label: "Materi" },
];
export function LiveSession({
  id,
  boot,
  refresh,
}: {
  id: string;
  boot: Boot;
  refresh: () => Promise<void>;
}) {
  const { notify } = useApp();
  const [detail, setDetail] = useState<BackendDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("transcript");
  const [pending, setPending] = useState<CaptureDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [confirm, setConfirm] = useState<"end" | "archive" | null>(null);
  const [recording, setRecording] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      setDetail(await api<BackendDetail>(`sessions/${id}`));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kelas tidak tersedia.");
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!detail || detail.session.archived_at) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [detail?.session.archived_at, load]);
  useEffect(() => {
    const box = workspace.current;
    const panel = box?.querySelector<HTMLElement>(".transcript-panel");
    if (!box || !panel || !pending || tab !== "transcript") return;
    const resize = () =>
      box.style.setProperty("--transcript-panel-height", `${panel.offsetHeight}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(panel);
    return () => {
      observer.disconnect();
      box.style.removeProperty("--transcript-panel-height");
    };
  }, [pending?.id, tab]);
  async function act(work: () => Promise<unknown>, message?: string) {
    setBusy(true);
    try {
      await work();
      await Promise.all([load(), refresh()]);
      if (message) notify(message);
      return true;
    } catch (e) {
      notify(e instanceof Error ? e.message : "Permintaan gagal.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!detail)
    return error ? (
      <Empty
        title={error}
        action={
          <button className="button secondary" onClick={load}>
            Coba lagi
          </button>
        }
      />
    ) : (
      <div className="processing">
        <LoaderCircle className="spin" />
        Memuat kelas…
      </div>
    );
  const lesson = detail.session;
  const course = boot.courses.find((c) => c.id === lesson.course_id);
  const owner = course?.owner_id === boot.profile.id;
  const lecturer = boot.profile.role === "lecturer";
  const selectedSaved = boot.saved.filter((s) => s.session_id === id);
  const saved: SavedItem[] = selectedSaved.map((s) => ({
    id: s.id,
    sessionId: id,
    type: s.kind,
    title: s.title,
    text: s.text,
    summary: s.summary || undefined,
    time: s.start_seconds,
    end: s.end_seconds ?? undefined,
    reviewed: s.reviewed,
  }));
  const captureItem: SavedItem | null = pending
    ? {
        id: pending.id,
        sessionId: id,
        type: "capture",
        title: "Capture",
        text: pending.text,
        summary: pending.summary,
        draft: pending.question,
        time: pending.start,
        end: pending.end,
        reviewed: false,
      }
    : null;
  const segments: Segment[] = detail.transcript.map((s) => ({
    id: s.id,
    time: s.start_seconds,
    text: s.text,
    topic: "Bagian kelas",
  }));
  function source(sourceId: string) {
    setTab("transcript");
    requestAnimationFrame(() =>
      document
        .getElementById(`source-${sourceId}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
  }
  return (
    <div className={`classroom ${pending ? "preview-open" : ""}`}>
      <Link className="back-link" href="/">
        <ArrowLeft size={15} />
        {course?.name || "Kelas"}
      </Link>
      <div className="page-heading session-heading">
        <div>
          <h1>{lesson.title}</h1>
          <p className="session-meta">
            {new Date(lesson.starts_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
            <span className={`badge ${lesson.status === "live" ? "live" : ""}`}>
              {lesson.status}
            </span>
          </p>
        </div>
        {owner && (
          <div className="session-actions">
            <button
              className="button secondary small"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lesson.join_code);
                  notify("Kode disalin.");
                } catch {
                  notify(`Kode: ${lesson.join_code}`);
                }
              }}
            >
              {lesson.join_code}
            </button>
            {lesson.status === "upcoming" && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => act(() => api(`sessions/${id}/start`, "POST", {}))}
              >
                Mulai kelas
              </button>
            )}
            {lesson.status === "live" && (
              <button
                className="button secondary"
                disabled={busy || recording}
                onClick={() => setConfirm("end")}
              >
                Akhiri kelas
              </button>
            )}
            {lesson.status === "failed" && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => act(() => api(`sessions/${id}/retry`, "POST", {}))}
              >
                Coba proses lagi
              </button>
            )}
            {!["live", "processing"].includes(lesson.status) && !lesson.archived_at && (
              <button className="text-button" onClick={() => setConfirm("archive")}>
                Arsipkan
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <div className="class-tabs">
        <div className="tabs" role="tablist" aria-label="Bagian kelas">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "questions" && detail.questions.length > 0
                ? ` (${detail.questions.length})`
                : ""}
            </button>
          ))}
        </div>
      </div>
      {owner && lesson.status === "live" && (
        <Microphone
          sessionId={id}
          startedAt={lesson.started_at!}
          onChange={setRecording}
          onUploaded={load}
        />
      )}
      <div className={`session-workspace ${pending ? "has-preview" : ""}`} ref={workspace}>
        <div className="session-content" role="tabpanel">
          {tab === "transcript" && (
            <>
              {!segments.length && (
                <p className="demo-note">
                  {lesson.status === "live"
                    ? "Menunggu transkrip dari perangkat dosen."
                    : "Transkrip tersedia setelah dosen memulai kelas."}
                </p>
              )}
              <TranscriptPanel
                segments={segments}
                saved={saved}
                lecturer={lecturer}
                pendingCapture={captureItem}
                captureBusy={busy}
                bookmark={(segment) => {
                  const existing = selectedSaved.find(
                    (s) => s.kind === "bookmark" && s.start_seconds === segment.time,
                  );
                  void act(() =>
                    existing
                      ? api(`saved/${existing.id}`, "DELETE")
                      : api(`sessions/${id}/bookmarks`, "POST", {
                          segment_id: segment.id,
                          label: "Review nanti",
                        }),
                  );
                }}
                capture={() => {
                  void act(async () =>
                    setPending(
                      await api<CaptureDraft>(`sessions/${id}/capture-preview`, "POST", {}),
                    ),
                  );
                }}
                onPhoto={() => setPhoto(true)}
                onSaved={() => window.location.assign("/review")}
                onAsk={() => setTab("questions")}
              />
              {!lecturer && segments.length > 0 && (
                <details className="panel">
                  <summary>Ada bagian yang belum dipahami?</summary>
                  {segments.map((s) => (
                    <div className="live-row" key={s.id}>
                      <span>
                        {seconds(s.time)} · {s.text.slice(0, 80)}…
                      </span>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          act(
                            () =>
                              api(`sessions/${id}/bookmarks`, "POST", {
                                segment_id: s.id,
                                label: "Bingung",
                              }),
                            "Ditandai untuk review.",
                          )
                        }
                      >
                        <HelpCircle size={15} />
                        Bingung
                      </button>
                    </div>
                  ))}
                </details>
              )}
            </>
          )}
          {tab === "notes" && (
            <LiveNotes
              detail={detail}
              owner={owner}
              onSource={source}
              onSave={(text) =>
                act(() => api(`sessions/${id}/personal-note`, "PUT", { text }), "Catatan disimpan.")
              }
              onAgenda={(draft) =>
                act(
                  () =>
                    api("agenda", "POST", {
                      ...draft,
                      session_id: id,
                      confirmed: true,
                      done: false,
                    }),
                  "Agenda disimpan.",
                )
              }
            />
          )}
          {tab === "questions" && (
            <section className="panel">
              <h2>Pertanyaan kelas</h2>
              {!lecturer && (
                <form
                  className="live-question-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const text = String(new FormData(form).get("text"));
                    if (
                      await act(
                        () =>
                          api(`sessions/${id}/questions`, "POST", {
                            text,
                            at_seconds: detail.transcript.at(-1)?.end_seconds || 0,
                          }),
                        "Pertanyaan anonim terkirim.",
                      )
                    )
                      form.reset();
                  }}
                >
                  <textarea
                    name="text"
                    aria-label="Pertanyaan anonim"
                    placeholder="Bagian mana yang ingin kamu tanyakan?"
                    minLength={3}
                    maxLength={1000}
                    required
                  />
                  <button className="button primary" disabled={busy}>
                    Kirim anonim
                  </button>
                </form>
              )}
              {!detail.questions.length && <Empty title="Belum ada pertanyaan" />}
              {detail.questions.map((q) => (
                <article className="live-note" key={q.id}>
                  <h3>{q.text}</h3>
                  <p>{q.answer || (q.answered_orally ? "Sudah dijawab lisan" : "Belum dijawab")}</p>
                  {!lecturer && (
                    <button
                      className="button secondary small"
                      aria-pressed={q.supported}
                      disabled={busy}
                      onClick={() =>
                        act(() =>
                          api(`questions/${q.id}/support`, "POST", { support: !q.supported }),
                        )
                      }
                    >
                      {q.supported ? "Didukung" : "Dukung"} · {q.votes}
                    </button>
                  )}
                  {owner && (
                    <form
                      className="live-question-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act(
                          () =>
                            api(`questions/${q.id}/answer`, "POST", {
                              text: new FormData(e.currentTarget).get("answer"),
                              oral: false,
                            }),
                          "Jawaban disimpan.",
                        );
                      }}
                    >
                      <textarea
                        name="answer"
                        aria-label={`Jawaban ${q.text}`}
                        defaultValue={q.answer || ""}
                        required
                        maxLength={5000}
                      />
                      <button className="button secondary small" disabled={busy}>
                        Jawab
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </section>
          )}
          {tab === "materials" && (
            <LiveMaterials detail={detail} owner={owner} onSource={source} act={act} />
          )}
        </div>
        {captureItem && pending && (
          <CapturePreview
            key={pending.id}
            item={captureItem}
            onDiscard={() => setPending(null)}
            onSave={async (question) => {
              await api("saved/capture", "POST", { token: pending.token, question });
              setPending(null);
              await refresh();
              notify("Capture tersimpan.");
            }}
            onAsk={async (text) => {
              await api(`sessions/${id}/questions`, "POST", { text, at_seconds: pending.start });
              await load();
            }}
          />
        )}
      </div>
      <Modal open={photo} title="Tambahkan foto" onClose={() => setPhoto(false)}>
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            f.set("session_id", id);
            if (await act(() => api("files/photos", "POST", f), "Foto disimpan.")) setPhoto(false);
          }}
        >
          <label>
            Foto papan atau slide
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <label>
            Detik dalam sesi
            <input
              name="at_seconds"
              type="number"
              min={0}
              max={86400}
              step="0.1"
              defaultValue={detail.transcript.at(-1)?.end_seconds || 0}
              required
            />
          </label>
          <button className="button primary" disabled={busy}>
            <Camera size={16} />
            Simpan foto
          </button>
        </form>
      </Modal>
      <Modal
        open={!!confirm}
        title={confirm === "end" ? "Akhiri kelas?" : "Arsipkan kelas?"}
        onClose={() => setConfirm(null)}
      >
        <p>
          {confirm === "end"
            ? "Catatan dan panduan review akan diproses otomatis."
            : "Materi bersama disembunyikan. Kamu bisa memulihkannya dalam 30 hari. Simpanan pribadi tetap tersedia."}
        </p>
        <div className="live-row">
          <button className="button secondary" onClick={() => setConfirm(null)}>
            Batal
          </button>
          <button
            className="button primary"
            disabled={busy}
            onClick={async () => {
              if (await act(() => api(`sessions/${id}/${confirm}`, "POST", {}))) setConfirm(null);
            }}
          >
            {confirm === "end" ? "Akhiri kelas" : "Arsipkan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
function LiveNotes({
  detail,
  owner,
  onSource,
  onSave,
  onAgenda,
}: {
  detail: BackendDetail;
  owner: boolean;
  onSource: (id: string) => void;
  onSave: (text: string) => Promise<boolean>;
  onAgenda: (draft: {
    title: string;
    kind: string;
    due_at: string;
    source: { quote: string; source_id: string };
  }) => Promise<boolean>;
}) {
  const [note, setNote] = useState(detail.personal_note);
  const [busy, setBusy] = useState(false);
  const [confusion, setConfusion] = useState<{ start_seconds: number; total: number }[]>([]);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);
  useEffect(() => {
    if (owner)
      api<typeof confusion>(`sessions/${detail.session.id}/confusion`)
        .then(setConfusion)
        .catch(() => {});
  }, [owner, detail.session.id]);
  const draft = draftIndex !== null ? detail.results?.agenda_drafts[draftIndex] : null;
  return (
    <section className="panel">
      <h2>Catatan kelas</h2>
      {!detail.results && (
        <Empty
          title={
            detail.session.status === "processing"
              ? "Catatan sedang disiapkan"
              : "Catatan belum tersedia"
          }
          text={detail.session.processing_error || undefined}
        />
      )}
      <NoteList notes={detail.results?.notes || []} onSource={onSource} />
      {detail.results && !detail.results.notes.length && (
        <p className="live-muted">Belum ada pembahasan yang tercatat dalam sesi ini.</p>
      )}
      {detail.review && (
        <>
          <h2>Review untukmu</h2>
          <NoteList notes={detail.review.sections} onSource={onSource} />
          {detail.review.previous.map((p) => (
            <Link key={p.session_id} className="panel live-row" href={`/session/${p.session_id}`}>
              <span>Ulangi pertemuan sebelumnya</span>
              <p>{p.reason}</p>
            </Link>
          ))}
        </>
      )}
      {!owner && (
        <details className="live-note">
          <summary>Catatan pribadi</summary>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              await onSave(note);
              setBusy(false);
            }}
          >
            <textarea
              aria-label="Catatan pribadi"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={50000}
            />
            <button className="button secondary" disabled={busy}>
              Simpan catatan
            </button>
          </form>
        </details>
      )}
      {owner && (
        <details className="live-note">
          <summary>Rekap kebingungan kelas</summary>
          {confusion.length ? (
            confusion.map((c) => (
              <p key={c.start_seconds}>
                {seconds(c.start_seconds)} · {c.total} mahasiswa
              </p>
            ))
          ) : (
            <p>Belum ada bagian yang ditandai bingung.</p>
          )}
        </details>
      )}
      {!!detail.results?.agenda_drafts.length && !owner && (
        <>
          <h2>Agenda dari kelas</h2>
          {detail.results.agenda_drafts.map((d, i) => (
            <div className="live-row" key={i}>
              <div className="row-main">
                <h3>{d.title}</h3>
                <p>
                  {d.due_at
                    ? new Date(d.due_at).toLocaleString("id-ID")
                    : "Tanggal perlu dikonfirmasi"}
                </p>
              </div>
              <button className="button secondary small" onClick={() => setDraftIndex(i)}>
                Tinjau
              </button>
            </div>
          ))}
        </>
      )}
      <Modal open={!!draft} title="Tinjau agenda" onClose={() => setDraftIndex(null)}>
        {draft && (
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              const ok = await onAgenda({
                title: String(f.get("title")),
                kind: draft.kind,
                due_at: new Date(String(f.get("date"))).toISOString(),
                source: { quote: draft.quote, source_id: draft.source_id },
              });
              setBusy(false);
              if (ok) setDraftIndex(null);
            }}
          >
            <blockquote>{draft.quote}</blockquote>
            <label>
              Judul
              <input
                name="title"
                defaultValue={draft.title}
                minLength={2}
                maxLength={160}
                required
              />
            </label>
            <label>
              Waktu
              <input
                name="date"
                type="datetime-local"
                required
                defaultValue={
                  draft.due_at
                    ? new Date(
                        new Date(draft.due_at).getTime() - new Date().getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
              />
            </label>
            <button className="button primary" disabled={busy}>
              Konfirmasi agenda
            </button>
          </form>
        )}
      </Modal>
    </section>
  );
}
function NoteList({
  notes,
  onSource,
}: {
  notes: { title: string; body: string; source_ids: string[] }[];
  onSource: (id: string) => void;
}) {
  return (
    <>
      {notes.map((n, i) => (
        <article className="live-note" key={i}>
          <h3>{n.title}</h3>
          <p>{n.body}</p>
          {n.source_ids.map((id) => (
            <button key={id} className="text-button live-source-link" onClick={() => onSource(id)}>
              Lihat sumber
            </button>
          ))}
        </article>
      ))}
    </>
  );
}
