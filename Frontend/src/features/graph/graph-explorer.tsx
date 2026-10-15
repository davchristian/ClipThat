"use client";
import { useEffect, useRef, useState } from "react";
import cytoscape, { type Core } from "cytoscape";
import { ArrowUpRight, Network, X } from "lucide-react";
import type { ConceptGraph } from "@/lib/types";

const CARD_WIDTH = 272;
const CARD_HEIGHT = 156;

export function GraphExplorer({
  graph,
  onSource,
  onEdit,
}: {
  graph: ConceptGraph;
  onSource: (nodeId: string, sourceId?: string) => void;
  onEdit?: () => void;
}) {
  const canvas = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLElement>(null);
  const cy = useRef<Core | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const signature = JSON.stringify(graph);
  useEffect(() => {
    if (!canvas.current || !surface.current || !graph.nodes.length) return;
    try {
      surface.current.style.width = "100%";
      canvas.current.style.height = "640px";
      const value = JSON.parse(signature) as ConceptGraph;
      const theme = getComputedStyle(canvas.current);
      const network = cytoscape({
        container: canvas.current,
        elements: [
          ...value.nodes.map((n) => ({
            data: { id: n.id, title: n.title },
          })),
          ...value.edges.map((e, i) => ({
            data: { id: `edge:${i}`, source: e.from, target: e.to, relation: e.relation },
          })),
        ],
        style: [
          {
            selector: "node",
            style: {
              shape: "round-rectangle",
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              "background-opacity": 0,
              "border-width": 0,
              "overlay-opacity": 0,
            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": theme.getPropertyValue("--muted").trim(),
              "line-style": "dashed",
              "line-dash-pattern": [6, 5],
              "curve-style": "taxi",
              "taxi-direction": "downward",
              "taxi-turn": "50%",
              "source-endpoint": "0% 50%",
              "target-endpoint": "0% -50%",
              opacity: 0.35,
            },
          },
          { selector: "edge.dimmed", style: { opacity: 0.12 } },
          {
            selector: "edge.related",
            style: {
              "line-color": theme.getPropertyValue("--green").trim(),
              opacity: 0.85,
            },
          },
        ],
        layout: {
          name: "breadthfirst",
          directed: true,
          animate: false,
          fit: false,
          padding: 32,
          spacingFactor: 1.2,
          transform: (_node, position) => ({ x: position.x, y: position.y * 0.7 }),
        },
        minZoom: 1,
        maxZoom: 1,
        zoomingEnabled: false,
        panningEnabled: false,
        userZoomingEnabled: false,
        userPanningEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true,
      });
      cy.current = network;
      // Size the fixed diagram to its content; larger maps use ordinary scrolling.
      const bounds = network.elements().boundingBox();
      network.nodes().positions((n) => ({
        x: n.position("x") - bounds.x1 + 32,
        y: n.position("y") - bounds.y1 + 32,
      }));
      surface.current.style.width = `${Math.ceil(bounds.w + 64)}px`;
      canvas.current.style.height = `${Math.max(320, Math.ceil(bounds.h + 64))}px`;
      network.resize();
      setPositions(Object.fromEntries(network.nodes().map((n) => [n.id(), n.position()])));
      setFailed(false);
      return () => {
        network.destroy();
        cy.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, [signature]);
  useEffect(() => {
    const network = cy.current;
    if (!network) return;
    network.elements().removeClass("dimmed related");
    if (selected && network.$id(selected).length) {
      const node = network.$id(selected);
      network.elements().difference(node.closedNeighborhood()).addClass("dimmed");
      node.connectedEdges().addClass("related");
    }
  }, [selected, signature]);
  useEffect(() => {
    if (selected && window.matchMedia("(max-width: 1100px)").matches)
      detail.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const node = graph.nodes.find((n) => n.id === selected);
  const related = graph.edges.filter((e) => e.from === selected || e.to === selected);
  const visible = node ? new Set([node.id]) : null;
  if (visible && node)
    for (const edge of graph.edges) {
      if (edge.from === node.id) visible.add(edge.to);
      if (edge.to === node.id) visible.add(edge.from);
    }
  return (
    <section className="knowledge-graph" aria-label="Peta konsep interaktif">
      {!graph.nodes.length ? (
        <div className="graph-empty">
          <Network size={30} />
          <h3>Peta konsep belum tersedia</h3>
          <p>Hubungan subbab disusun dari pembahasan dosen.</p>
        </div>
      ) : (
        <div className={`graph-stage ${node ? "has-detail" : ""}`}>
          <div className="graph-viewport">
            <div className="graph-surface" ref={surface}>
              <div className="graph-canvas" ref={canvas} aria-hidden="true" />
              <div className="graph-cards">
                {graph.nodes.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className={`graph-topic-card${selected === topic.id ? " selected" : ""}${visible && !visible.has(topic.id) ? " dimmed" : ""}`}
                    aria-label={topic.title}
                    aria-pressed={selected === topic.id}
                    hidden={!positions[topic.id]}
                    style={{
                      left: positions[topic.id]?.x,
                      top: positions[topic.id]?.y,
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                    }}
                    onClick={() => setSelected(topic.id)}
                  >
                    <strong>{topic.title}</strong>
                    {!!topic.topics?.length && <span>{topic.topics.join(", ")}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {node && (
            <aside className="graph-node-detail" ref={detail}>
              <button
                className="icon-button graph-detail-close"
                aria-label="Tutup detail subbab"
                onClick={() => setSelected(null)}
              >
                <X size={17} />
              </button>
              <span className="eyebrow">SUBBAB</span>
              <h3>{node.title}</h3>
              <p>{node.description}</p>
              <div className="graph-relations">
                {related.map((e, i) => {
                  const other = graph.nodes.find(
                    (n) => n.id === (e.from === node.id ? e.to : e.from),
                  );
                  return (
                    other && (
                      <button key={i} onClick={() => setSelected(other.id)}>
                        <small>{e.relation}</small>
                        <span>{other.title}</span>
                        <ArrowUpRight size={14} />
                      </button>
                    )
                  );
                })}
              </div>
              <button
                className="button secondary small"
                onClick={() => onSource(node.id, node.source_ids[0])}
              >
                Buka pembahasan <ArrowUpRight size={14} />
              </button>
            </aside>
          )}
        </div>
      )}
      <div className="graph-footer">
        <span>
          {graph.nodes.length} subbab · {graph.edges.length} hubungan
        </span>
        {graph.nodes.length > 0 && (
          <label className="graph-accessible-select">
            <span className="sr-only">Pilih subbab</span>
            <select
              aria-label="Pilih subbab"
              value={selected || ""}
              onChange={(e) => setSelected(e.target.value || null)}
            >
              <option value="">Pilih subbab</option>
              {graph.nodes.map((n) => (
                <option value={n.id} key={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {onEdit && graph.nodes.length > 0 && (
          <button className="text-button" onClick={onEdit}>
            Koreksi hubungan
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="field-error">
          Canvas belum bisa dibuka. Gunakan pilihan subbab untuk membaca detailnya.
        </p>
      )}
    </section>
  );
}
