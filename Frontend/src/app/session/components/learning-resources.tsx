"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, FileText, Upload } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal, SectionTitle } from "@/components/ui";
import { notesForLesson } from "@/data";
import { downloadText, readFile } from "@/lib/files";
import type { Lesson } from "@/lib/types";

export function MaterialsPanel({ lesson }: { lesson: Lesson }) {
  const { data, update, notify } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const notes = notesForLesson(lesson);
  async function upload(file?: File) {
    if (!file || ["done", "processing"].includes(lesson.status)) return;
    if (
      file.size > 1024 * 1024 ||
      !["application/pdf", "text/plain", "image/png", "image/jpeg"].includes(file.type)
    ) {
      notify("PDF, TXT, JPG, PNG · maksimal 1 MB.");
      return;
    }
    try {
      const url = await readFile(file);
      update((d) => ({
        ...d,
        materials: {
          ...d.materials,
          [lesson.id]: [
            ...(d.materials[lesson.id] || []),
            { id: crypto.randomUUID(), name: file.name, url },
          ],
        },
      }));
      notify("Materi ditambahkan.");
    } catch {
      notify("Berkas tidak bisa dibaca.");
    }
  }
  return (
    <section className="panel">
      <SectionTitle
        action={
          data.role === "lecturer" &&
          !["done", "processing"].includes(lesson.status) && (
            <button className="button secondary small" onClick={() => input.current?.click()}>
              <Upload size={15} />
              Tambah materi
            </button>
          )
        }
      >
        Materi
      </SectionTitle>
      {!["done", "processing"].includes(lesson.status) && (
        <input
          ref={input}
          type="file"
          hidden
          aria-label="Unggah materi"
          accept=".pdf,.txt,.png,.jpg,.jpeg"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      )}
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
              `${lesson.title}\n\n${notes.map((n) => `${n.title}\n${n.body}${n.formula ? `\n${n.formula}` : ""}`).join("\n\n")}`,
            )
          }
        >
          <Download size={18} />
        </button>
      </div>
      {(data.materials[lesson.id] || []).map((m) => (
        <div className="material-row" key={m.id}>
          <FileText size={22} />
          <span>
            <strong>{m.name}</strong>
            <small>Berkas lokal</small>
          </span>
          <a className="icon-button" href={m.url} download={m.name} aria-label={`Unduh ${m.name}`}>
            <Download size={18} />
          </a>
        </div>
      ))}
    </section>
  );
}

export function GraphPanel({
  lesson,
  onSource,
  onMaterial,
}: {
  lesson: Lesson;
  onSource: () => void;
  onMaterial: () => void;
}) {
  const { data, update, notify } = useApp();
  const [concept, setConcept] = useState(1);
  const [editing, setEditing] = useState(false);
  const [relation, setRelation] = useState("prasyarat");
  const notes = notesForLesson(lesson);
  const titles =
    lesson.id === "linear-05"
      ? ["Basis dan dimensi", "Representasi matriks", "Kernel dan image"]
      : notes.map((n) => n.title);
  const graph = data.graphBySession?.[lesson.id] || data.graph;
  return (
    <div className="graph-layout">
      <div className="concept-canvas" aria-label="Hubungan subbab">
        {titles.map((title, i) => (
          <div className="concept-step" key={title}>
            {i > 0 && (
              <span className="concept-edge">
                {graph.find((g) => g.from === i - 1)?.relation || "berkaitan"}
              </span>
            )}
            <button
              className={`concept-node ${concept === i ? "active" : ""}`}
              aria-pressed={concept === i}
              onClick={() => setConcept(i)}
            >
              {title}
            </button>
          </div>
        ))}
      </div>
      <aside className="panel concept-detail">
        <h3>{titles[concept]}</h3>
        <p>
          {concept === 0 && lesson.id === "linear-05"
            ? "Dasar dari pertemuan sebelumnya."
            : notes[concept]?.body}
        </p>
        <button className="text-button" onClick={onSource}>
          Buka pembahasan
          <ArrowRight size={14} />
        </button>
        <button className="text-button" onClick={onMaterial}>
          Materi terkait
          <ArrowRight size={14} />
        </button>
        {concept === 0 && lesson.id === "linear-05" && (
          <Link className="text-button" href="/session/basis-04">
            Pertemuan sebelumnya
            <ArrowRight size={14} />
          </Link>
        )}
        {data.role === "lecturer" && !["done", "processing"].includes(lesson.status) && (
          <button
            className="button secondary small"
            onClick={() => {
              setRelation(graph[0]?.relation || "prasyarat");
              setEditing(true);
            }}
          >
            Koreksi hubungan
          </button>
        )}
      </aside>
      <Modal
        open={editing && !["done", "processing"].includes(lesson.status)}
        title="Koreksi hubungan"
        onClose={() => setEditing(false)}
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (["done", "processing"].includes(lesson.status)) return;
            update((d) => ({
              ...d,
              graphBySession: {
                ...d.graphBySession,
                [lesson.id]: graph.map((g) => (g.from === 0 ? { ...g, relation } : g)),
              },
            }));
            setEditing(false);
            notify("Hubungan diperbarui.");
          }}
        >
          <p className="muted">
            {titles[0]} → {titles[1]}
          </p>
          <label>
            Jenis hubungan
            <select value={relation} onChange={(e) => setRelation(e.target.value)}>
              <option value="prasyarat">Prasyarat</option>
              <option value="berkaitan">Berkaitan</option>
              <option value="penerapan">Penerapan</option>
            </select>
          </label>
          <button className="button primary">Simpan hubungan</button>
        </form>
      </Modal>
    </div>
  );
}
