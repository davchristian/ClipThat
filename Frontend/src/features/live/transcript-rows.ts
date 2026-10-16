import type { Segment } from "../../lib/types";
import type { SpeechDraft } from "./deepgram-results";

export function transcriptRows(segments: Segment[], draft?: SpeechDraft) {
  const input = segments.map((segment) => ({ ...segment, pending: false }));
  for (const [index, segment] of (
    draft?.segments || (draft ? [{ start: draft.time, end: draft.time, text: draft.text }] : [])
  ).entries()) {
    // A server refresh can arrive before the microphone removes its uploaded batch.
    if (
      segments.some(
        (saved) =>
          saved.time === segment.start && saved.end === segment.end && saved.text === segment.text,
      )
    )
      continue;
    input.push({
      id: `draft-${index}`,
      time: segment.start,
      end: segment.end,
      text: segment.text,
      topic: "",
      pending: true,
    });
  }
  input.sort((a, b) => a.time - b.time);
  const rows: (Segment & { sourceIds: string[]; pending: boolean })[] = [];
  for (const segment of input) {
    const time = Math.floor(segment.time / 15) * 15;
    const last = rows.at(-1);
    if (last && last.time === time) {
      last.text += ` ${segment.text}`;
      last.end = Math.max(last.end ?? time, segment.end ?? segment.time);
      last.pending ||= segment.pending;
      if (!segment.pending) last.sourceIds.push(segment.id);
    } else rows.push({ ...segment, time, sourceIds: segment.pending ? [] : [segment.id] });
  }
  return rows;
}
