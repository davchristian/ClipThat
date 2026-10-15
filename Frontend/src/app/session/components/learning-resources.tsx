"use client";
import { useEffect, useRef, useState } from "react";
import { Download, FileText, Network, Upload } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal, SectionTitle } from "@/components/ui";
import { useContent } from "@/data/use-content";
import { downloadText, readFile } from "@/lib/files";
import { api } from "@/lib/api";
import { liveMode } from "@/lib/app-mode";
import type { Lesson } from "@/lib/types";
import { GraphExplorer } from "@/features/graph/graph-explorer";
import { graphForLesson } from "@/features/graph/graph-data";
export function MaterialsPanel({
  lesson,
  showGraph = false,
  onSource,
}: {
  lesson: Lesson;
  showGraph?: boolean;
  onSource?: (id?: string) => void;
}) {
  const { data, update, notify, pending } = useApp();
  const { notesForLesson } = useContent();
  const input = useRef<HTMLInputElement>(null);
  const [view, setView] = useState(showGraph ? "graph" : "files");
  useEffect(() => {
    setView(showGraph ? "graph" : "files");
  }, [showGraph]);
  const notes = notesForLesson(lesson);
  async function upload(file?: File) {
    if (!file) return;
    const max = liveMode ? 10 * 1024 * 1024 : 1024 * 1024;
    if (
      file.size > max ||
      !["application/pdf", "text/plain", "image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      )
    ) {
      notify(`PDF, TXT, JPG, PNG, WebP · maksimal ${liveMode ? 10 : 1} MB.`);
      return;
    }
    try {
      const url = await readFile(file);
      if (
        await update((d) => ({
          ...d,
          materials: {
            ...d.materials,
            [lesson.id]: [
              ...(d.materials[lesson.id] || []),
              { id: crypto.randomUUID(), name: file.name, url },
            ],
          },
        }))
      )
        notify("Materi ditambahkan.");
    } catch {
      notify("Berkas tidak dapat dibaca.");
    }
  }
  async function download(id: string, name: string) {
    try {
      const { signedUrl } = await api<{ signedUrl: string }>(`files/materials/${id}`);
      const response = await fetch(signedUrl);
      if (!response.ok) throw Error();
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      notify("Berkas belum dapat diunduh. Coba lagi.");
    }
  }
  return (
    <section className="materials-section">
      <div className="resource-switch" role="group" aria-label="Jenis materi">
        <button
          className={view === "files" ? "active" : ""}
          aria-pressed={view === "files"}
          onClick={() => setView("files")}
        >
          <FileText size={16} /> Berkas
        </button>
        <button
          className={view === "graph" ? "active" : ""}
          aria-pressed={view === "graph"}
          onClick={() => setView("graph")}
        >
          <Network size={16} /> Peta konsep
        </button>
      </div>
      {view === "graph" ? (
        <GraphPanel
          lesson={lesson}
          onSource={onSource || (() => {})}
          onMaterial={() => setView("files")}
        />
      ) : (
        <section className="panel">
          <SectionTitle
            action={
              data.role === "lecturer" && (
                <button
                  className="button secondary small"
                  disabled={pending}
                  onClick={() => input.current?.click()}
                >
                  <Upload size={15} /> Tambah materi
                </button>
              )
            }
          >
            Berkas kelas
          </SectionTitle>
          <input
            ref={input}
            type="file"
            hidden
            aria-label="Unggah materi"
            accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {!liveMode && (
            <div className="material-row">
              <FileText size={22} />
              <span>
                <strong>{lesson.title}.txt</strong>
                <small>Materi contoh</small>
              </span>
              <button
                className="icon-button"
                aria-label="Unduh materi contoh"
                onClick={() =>
                  downloadText(
                    `${lesson.title}.txt`,
                    notes.map((n) => `${n.title}\n${n.body}`).join("\n\n"),
                  )
                }
              >
                <Download size={18} />
              </button>
            </div>
          )}
          {liveMode && !(data.materials[lesson.id] || []).length && (
            <p className="muted">Belum ada berkas dari dosen.</p>
          )}
          {(data.materials[lesson.id] || []).map((m) => (
            <div className="material-row" key={m.id}>
              <FileText size={22} />
              <span>
                <strong>{m.name}</strong>
                <small>Materi dosen</small>
              </span>
              {liveMode ? (
                <button
                  className="icon-button"
                  aria-label={`Unduh ${m.name}`}
                  onClick={() => void download(m.id, m.name)}
                >
                  <Download size={18} />
                </button>
              ) : (
                <a
                  className="icon-button"
                  href={m.url}
                  download={m.name}
                  aria-label={`Unduh ${m.name}`}
                >
                  <Download size={18} />
                </a>
              )}
            </div>
          ))}
        </section>
      )}
    </section>
  );
}
export function GraphPanel({
  lesson,
  onSource,
}: {
  lesson: Lesson;
  onSource: (id?: string) => void;
  onMaterial: () => void;
}) {
  const { data, update, notify, pending } = useApp();
  const { notesForLesson } = useContent();
  const graph = graphForLesson(lesson, notesForLesson(lesson), data.conceptGraphs?.[lesson.id]);
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [relation, setRelation] = useState("prasyarat");
  return (
    <>
      <GraphExplorer
        graph={graph}
        onSource={(_, source) => onSource(source)}
        onEdit={
          data.role === "lecturer"
            ? () => {
                setFrom(graph.edges[0]?.from || graph.nodes[0]?.id || "");
                setTo(graph.edges[0]?.to || graph.nodes[1]?.id || "");
                setRelation(graph.edges[0]?.relation || "prasyarat");
                setEditing(true);
              }
            : undefined
        }
      />
      <Modal open={editing} title="Koreksi hubungan" onClose={() => setEditing(false)}>
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!from || !to || from === to) return;
            const next = {
              ...graph,
              edges: [
                ...graph.edges.filter((e) => !(e.from === from && e.to === to)),
                { from, to, relation },
              ],
            };
            if (
              await update((d) => ({
                ...d,
                conceptGraphs: { ...d.conceptGraphs, [lesson.id]: next },
              }))
            ) {
              setEditing(false);
              notify("Hubungan diperbarui.");
            }
          }}
        >
          <div className="form-row">
            <label>
              Dari
              <select value={from} onChange={(e) => setFrom(e.target.value)} required>
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ke
              <select value={to} onChange={(e) => setTo(e.target.value)} required>
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Jenis hubungan
            <select value={relation} onChange={(e) => setRelation(e.target.value)}>
              <option value="prasyarat">Prasyarat</option>
              <option value="berkaitan">Berkaitan</option>
              <option value="penerapan">Penerapan</option>
            </select>
          </label>
          <div className="dialog-actions">
            <button
              type="button"
              className="text-button"
              disabled={pending || !graph.edges.some((e) => e.from === from && e.to === to)}
              onClick={async () => {
                if (
                  await update((d) => ({
                    ...d,
                    conceptGraphs: {
                      ...d.conceptGraphs,
                      [lesson.id]: {
                        ...graph,
                        edges: graph.edges.filter((e) => !(e.from === from && e.to === to)),
                      },
                    },
                  }))
                ) {
                  setEditing(false);
                  notify("Hubungan dihapus.");
                }
              }}
            >
              Hapus hubungan
            </button>
            <button className="button primary" disabled={pending || from === to}>
              Simpan hubungan
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
