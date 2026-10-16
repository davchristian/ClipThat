export type SpeechSegment = { start: number; end: number; text: string };
export type SpeechDraft = { time: number; text: string; segments?: SpeechSegment[] } | null;

export function deepgramResult(value: unknown, offset: number) {
  const data = value as {
    type?: string;
    start?: number;
    duration?: number;
    is_final?: boolean;
    channel?: {
      alternatives?: {
        transcript?: string;
        words?: { start: number; end: number; word: string; punctuated_word?: string }[];
      }[];
    };
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
  const words = data.channel?.alternatives?.[0]?.words;
  const parts: SpeechSegment[] = [];
  if (
    Array.isArray(words) &&
    words.length &&
    words.every(
      (word) =>
        Number.isFinite(word.start) &&
        Number.isFinite(word.end) &&
        word.start >= 0 &&
        word.end >= word.start &&
        offset + word.end <= 86400 &&
        typeof (word.punctuated_word ?? word.word) === "string",
    )
  ) {
    for (const word of words) {
      const time = offset + word.start;
      const text = word.punctuated_word ?? word.word;
      const last = parts.at(-1);
      if (
        last &&
        Math.floor(last.start / 15) === Math.floor(time / 15) &&
        last.text.length + text.length + 1 <= 10000
      ) {
        last.text += ` ${text}`;
        last.end = Math.max(last.end, offset + word.end);
      } else parts.push({ start: time, end: offset + word.end, text });
    }
  }
  return {
    segment: { start: offset + start, end: offset + start + duration, text: text.trim() },
    final: data.is_final === true,
    ...(parts.length ? { parts } : {}),
  };
}
