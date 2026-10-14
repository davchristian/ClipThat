"use client";
import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { BackendDetail, BackendGraph } from "@/lib/backend-types";
import { Empty, Modal } from "@/components/ui";

export function LiveMaterials({
  detail,
  owner,
  onSource,
  act,
}: {
  detail: BackendDetail;
  owner: boolean;
  onSource: (id: string) => void;
  act: (work: () => Promise<unknown>, message?: string) => Promise<boolean>;
}) {
  const graph = detail.results?.graph;
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const node = graph?.nodes.find((n) => n.id === selected);
  return (
    <section className="panel">
      <h2>Materi kelas</h2>
      {detail.materials
        .filter((m) => !m.archived_at)
        .map((m) => (
          <div className="live-row" key={m.id}>
            <FileText size={18} />
            <button
              className="text-button row-main"
              onClick={() =>
                act(async () => {
                  const file = await api<{ signedUrl: string }>(`files/materials/${m.id}`);
                  window.open(file.signedUrl, "_blank", "noopener,noreferrer");
                })
              }
            >
              {m.name}
            </button>
            {owner && detail.session.status !== "live" && (
              <button
                className="text-button"
                onClick={() =>
                  act(
                    () => api(`files/materials/${m.id}/archive`, "POST", {}),
                    "Materi diarsipkan.",
                  )
                }
              >
                Arsipkan
              </button>
            )}
          </div>
        ))}
      {!detail.materials.some((m) => !m.archived_at) && <Empty title="Belum ada materi" />}
      {owner && (
        <form
          className="form-stack live-upload"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            f.set("session_id", detail.session.id);
            setBusy(true);
            const ok = await act(() => api("files/materials", "POST", f), "Materi diunggah.");
            setBusy(false);
            if (ok) form.reset();
          }}
        >
          <label>
            PDF atau gambar · maks. 10 MB
            <input
              name="file"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              required
            />
          </label>
          <button className="button secondary" disabled={busy}>
            <Upload size={16} />
            Unggah materi
          </button>
        </form>
      )}
      {owner && detail.materials.some((m) => m.archived_at) && (
        <details>
          <summary>Arsip materi</summary>
          {detail.materials
            .filter((m) => m.archived_at)
            .map((m) => (
              <div key={m.id} className="live-row">
                <span>{m.name}</span>
                <button
                  className="text-button"
                  onClick={() =>
                    act(
                      () => api(`files/materials/${m.id}/restore`, "POST", {}),
                      "Materi dipulihkan.",
                    )
                  }
                >
                  Pulihkan
                </button>
              </div>
            ))}
        </details>
      )}
      <div className="live-note">
        <div className="live-row">
          <h2 className="row-main">Peta konsep</h2>
          {owner && graph && (
            <button className="button secondary small" onClick={() => setEditing(true)}>
              Koreksi
            </button>
          )}
        </div>
        {!graph ? (
          <p className="live-muted">Peta konsep disiapkan bersama catatan setelah kelas.</p>
        ) : (
          <>
            <div className="live-graph-grid">
              {graph.nodes.map((n) => (
                <button
                  key={n.id}
                  className="live-graph-node"
                  aria-pressed={selected === n.id}
                  onClick={() => setSelected(n.id)}
                >
                  {n.title}
                </button>
              ))}
            </div>
            {node && (
              <article className="panel">
                <h3>{node.title}</h3>
                <p>{node.description}</p>
                {graph.edges
                  .filter((e) => e.from === node.id || e.to === node.id)
                  .map((e, i) => (
                    <p key={i} className="live-muted">
                      {graph.nodes.find((n) => n.id === e.from)?.title} →{" "}
                      {graph.nodes.find((n) => n.id === e.to)?.title} · {e.relation}
                    </p>
                  ))}
                {node.source_ids.map((id) => (
                  <button
                    key={id}
                    className="text-button live-source-link"
                    onClick={() => onSource(id)}
                  >
                    Buka transkrip terkait
                  </button>
                ))}
              </article>
            )}
          </>
        )}
      </div>
      {graph && (
        <GraphEditor
          key={JSON.stringify(graph)}
          open={editing}
          graph={graph}
          onClose={() => setEditing(false)}
          save={async (next) => {
            if (
              await act(
                () => api(`sessions/${detail.session.id}/graph`, "PUT", next),
                "Peta konsep disimpan.",
              )
            )
              setEditing(false);
          }}
        />
      )}
    </section>
  );
}
function GraphEditor({
  open,
  graph,
  onClose,
  save,
}: {
  open: boolean;
  graph: BackendGraph;
  onClose: () => void;
  save: (graph: BackendGraph) => Promise<void>;
}) {
  const [draft, setDraft] = useState(graph);
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} title="Koreksi peta konsep" onClose={onClose} wide>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await save(draft);
          } finally {
            setBusy(false);
          }
        }}
      >
        {draft.nodes.map((n, i) => (
          <div className="live-note" key={n.id}>
            <label>
              Subbab {i + 1}
              <input
                required
                value={n.title}
                minLength={2}
                maxLength={160}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    nodes: draft.nodes.map((v) =>
                      v.id === n.id ? { ...v, title: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              Penjelasan
              <textarea
                value={n.description}
                maxLength={3000}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    nodes: draft.nodes.map((v) =>
                      v.id === n.id ? { ...v, description: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
        {draft.edges.map((edge, i) => (
          <div key={i} className="live-row">
            <label>
              Dari
              <select
                value={edge.from}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    edges: draft.edges.map((v, j) =>
                      j === i ? { ...v, from: e.target.value } : v,
                    ),
                  })
                }
              >
                {draft.nodes.map((n) => (
                  <option value={n.id} key={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ke
              <select
                value={edge.to}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    edges: draft.edges.map((v, j) => (j === i ? { ...v, to: e.target.value } : v)),
                  })
                }
              >
                {draft.nodes.map((n) => (
                  <option value={n.id} key={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hubungan
              <input
                value={edge.relation}
                maxLength={160}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    edges: draft.edges.map((v, j) =>
                      j === i ? { ...v, relation: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="text-button"
              onClick={() => setDraft({ ...draft, edges: draft.edges.filter((_, j) => j !== i) })}
            >
              Hapus hubungan
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button secondary"
          disabled={!draft.nodes.length || draft.edges.length >= 100}
          onClick={() =>
            setDraft({
              ...draft,
              edges: [
                ...draft.edges,
                { from: draft.nodes[0].id, to: draft.nodes.at(-1)!.id, relation: "Berkaitan" },
              ],
            })
          }
        >
          Tambah hubungan
        </button>
        <button className="button primary" disabled={busy}>
          Simpan koreksi
        </button>
      </form>
    </Modal>
  );
}
