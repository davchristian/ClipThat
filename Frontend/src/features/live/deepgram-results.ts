export type SpeechSegment = { start: number; end: number; text: string };
export type SpeechDraft = { time: number; text: string } | null;

export function deepgramResult(value: unknown, offset: number) {
  const data = value as {
    type?: string;
    start?: number;
    duration?: number;
    is_final?: boolean;
    channel?: { alternatives?: { transcript?: string }[] };
  } | null;
  if (data?.type !== "Results") return null;
  const text = data.channel?.alternatives?.[0]?.transcript;
  if (typeof text !== "string" || !text.trim()) return null;
  const start = data.start,
    duration = data.duration;
  if (
    typeof start !== "number" ||
    typeof duration !== "number" ||
    !Number.isFinite(start) ||
    !Number.isFinite(duration) ||
    start < 0 ||
    duration < 0 ||
    offset + start + duration > 86400 ||
    text.length > 10000
  )
    return null;
  return {
    segment: { start: offset + start, end: offset + start + duration, text: text.trim() },
    final: data.is_final === true,
  };
}
