import { checked, type Db } from "./db";
import { ApiError } from "./http";
import type { SourceSegment } from "./ai";
export async function readTranscript(db: Db, sessionId: string) {
  const all: SourceSegment[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const rows = checked(
      await db
        .from("transcript_segments")
        .select("*")
        .eq("session_id", sessionId)
        .order("start_seconds")
        .order("id")
        .range(offset, offset + 999),
    );
    all.push(...(rows || []));
    if (!rows || rows.length < 1000) return all;
  }
  throw new ApiError(
    422,
    "transcript_too_long",
    "Transkrip melebihi batas 20.000 segmen per sesi.",
  );
}
