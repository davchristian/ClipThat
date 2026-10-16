import type { ConceptGraph, Lesson, StudyNote } from "@/lib/types";
export function graphForLesson(
  lesson: Lesson,
  notes: StudyNote[],
  supplied?: ConceptGraph,
): ConceptGraph {
  if (supplied) return supplied;
  const nodes = notes.map((n, i) => ({
    id: `${lesson.id}-${i}`,
    title: n.title,
    description: n.body,
    topics: n.topics || [],
    source_ids: n.source_ids || [],
    sessionId: lesson.id,
    group: String(lesson.number),
    sections: [{ title: "Buka pembahasan", source_ids: n.source_ids || [], sessionId: lesson.id }],
  }));
  return {
    nodes,
    edges: nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id, relation: "berkaitan" })),
  };
}
export function mergeGraphs(graphs: { sessionId: string; graph: ConceptGraph }[]): ConceptGraph {
  const nodes: ConceptGraph["nodes"] = [];
  const edges: ConceptGraph["edges"] = [];
  const canonical = new Map<string, string>();
  for (const { sessionId, graph } of graphs) {
    const ids = new Map<string, string>();
    for (const node of graph.nodes) {
      const sections = (
        node.sections?.length
          ? node.sections
          : [{ title: "Buka pembahasan", source_ids: node.source_ids }]
      ).map((section) => ({ ...section, sessionId: section.sessionId || sessionId }));
      const key = node.title.trim().toLocaleLowerCase("id-ID");
      let id = canonical.get(key);
      if (!id) {
        id = `${sessionId}:${node.id}`;
        canonical.set(key, id);
        nodes.push({ ...node, sections, id, sessionId, group: sessionId });
      } else {
        const existing = nodes.find((n) => n.id === id)!;
        existing.source_ids = [...new Set([...existing.source_ids, ...node.source_ids])];
        if (node.description && !existing.description.includes(node.description))
          existing.description += `\n\n${node.description}`;
        existing.sections = [...(existing.sections || []), ...sections];
      }
      ids.set(node.id, id);
    }
    for (const e of graph.edges) {
      const from = ids.get(e.from),
        to = ids.get(e.to);
      if (
        from &&
        to &&
        from !== to &&
        !edges.some((x) => x.from === from && x.to === to && x.relation === e.relation)
      )
        edges.push({ from, to, relation: e.relation });
    }
  }
  return { nodes, edges };
}
