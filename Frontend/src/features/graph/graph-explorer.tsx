"use client";
import { useEffect, useRef, useState } from "react";
import cytoscape, { type Core } from "cytoscape";
import { ArrowUpRight, Focus, Maximize2, Minus, Network, Plus, Search, X } from "lucide-react";
import type { ConceptGraph } from "@/lib/types";

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
  const wrapper = useRef<HTMLElement>(null);
  const cy = useRef<Core | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState(false);
  const signature = JSON.stringify(graph);
  useEffect(() => {
    if (!canvas.current || !graph.nodes.length) return;
    try {
      const value = JSON.parse(signature) as ConceptGraph;
      const groups = [...new Set(value.nodes.map((n) => n.group || ""))];
      const colors = ["#4f7562", "#b28159", "#78939c", "#97946b"];
      const network = cytoscape({
        container: canvas.current,
        elements: [
          ...value.nodes.map((n) => ({
            data: {
              id: n.id,
              title: n.title,
              color: colors[groups.indexOf(n.group || "") % colors.length],
            },
          })),
          ...value.edges.map((e, i) => ({
            data: { id: `edge:${i}`, source: e.from, target: e.to, relation: e.relation },
          })),
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "data(color)",
              width: 18,
              height: 18,
              label: "data(title)",
              "font-family": "Plus Jakarta Sans Variable, sans-serif",
              "font-size": 12,
              color: "#4e5d51",
              "text-valign": "bottom",
              "text-margin-y": 11,
              "text-wrap": "wrap",
              "text-max-width": "125px",
              "border-width": 5,
              "border-color": "#ffffff",
              "border-opacity": 0.8,
              "overlay-opacity": 0,
            },
          },
          {
            selector: "edge",
            style: { width: 1.2, "line-color": "#cad5c8", "curve-style": "bezier", opacity: 0.75 },
          },
          { selector: ".dimmed", style: { opacity: 0.13 } },
          {
            selector: "node.focused",
            style: {
              width: 26,
              height: 26,
              "border-color": "#dbe7d8",
              "border-width": 8,
              "font-weight": "bold",
              color: "#2e5145",
              "font-size": 13,
            },
          },
          { selector: "edge.related", style: { width: 2, "line-color": "#789782", opacity: 1 } },
          { selector: "node.matched", style: { "border-color": "#e8d4bb", "border-width": 8 } },
        ],
        layout: {
          name: "cose",
          animate: false,
          padding: 70,
          nodeRepulsion: () => 14000,
          idealEdgeLength: () => 130,
          componentSpacing: 100,
        },
        minZoom: 0.3,
        maxZoom: 3,
        boxSelectionEnabled: false,
        autoungrabify: false,
      });
      cy.current = network;
      if (network.zoom() > 1.2) {
        network.zoom(1.2);
        network.center();
      }
      setFailed(false);
      network.on("tap", "node", (e) => setSelected(e.target.id()));
      network.on("mouseover", "node", () => {
        if (canvas.current) canvas.current.style.cursor = "pointer";
      });
      network.on("mouseout", "node", () => {
        if (canvas.current) canvas.current.style.cursor = "grab";
      });
      network.on("tap", (e) => {
        if (e.target === network) setSelected(null);
      });
      const observer = new ResizeObserver(() => network.resize());
      observer.observe(canvas.current);
      return () => {
        observer.disconnect();
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
    network.elements().removeClass("dimmed focused related matched");
    if (selected && network.$id(selected).length) {
      const node = network.$id(selected);
      network.elements().difference(node.closedNeighborhood()).addClass("dimmed");
      node.addClass("focused");
      node.connectedEdges().addClass("related");
      requestAnimationFrame(() => {
        if (!network.destroyed()) {
          network.resize();
          network.center(node);
        }
      });
    }
    if (query.trim()) {
      const matches = network
        .nodes()
        .filter((n) =>
          String(n.data("title"))
            .toLocaleLowerCase("id-ID")
            .includes(query.trim().toLocaleLowerCase("id-ID")),
        );
      network.elements().addClass("dimmed");
      matches.closedNeighborhood().removeClass("dimmed");
      matches.addClass("matched");
    }
  }, [selected, query, signature]);
  const node = graph.nodes.find((n) => n.id === selected);
  const related = graph.edges.filter((e) => e.from === selected || e.to === selected);
  const zoom = (factor: number) => {
    const network = cy.current;
    if (network)
      network.zoom({
        level: network.zoom() * factor,
        renderedPosition: { x: network.width() / 2, y: network.height() / 2 },
      });
  };
  return (
    <section className="knowledge-graph" ref={wrapper} aria-label="Peta konsep interaktif">
      <div className="graph-toolbar">
        <div className="graph-search">
          <Search size={16} />
          <input
            aria-label="Cari subbab"
            placeholder="Cari subbab…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="graph-tools">
          <button className="icon-button" aria-label="Perkecil peta" onClick={() => zoom(0.8)}>
            <Minus size={17} />
          </button>
          <button className="icon-button" aria-label="Perbesar peta" onClick={() => zoom(1.25)}>
            <Plus size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Tampilkan seluruh peta"
            onClick={() => {
              cy.current?.fit(undefined, 70);
              setSelected(null);
              setQuery("");
            }}
          >
            <Focus size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Peta layar penuh"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void wrapper.current?.requestFullscreen?.();
            }}
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
      {!graph.nodes.length ? (
        <div className="graph-empty">
          <Network size={30} />
          <h3>Peta konsep belum tersedia</h3>
          <p>Hubungan subbab disusun dari pembahasan dosen.</p>
        </div>
      ) : (
        <div className={`graph-stage ${node ? "has-detail" : ""}`}>
          <div className="graph-canvas" ref={canvas} aria-hidden="true" />
          {node && (
            <aside className="graph-node-detail">
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
