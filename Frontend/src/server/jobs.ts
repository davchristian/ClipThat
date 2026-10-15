import { adminDb, checked } from "./db";
import { createLessonResult, createReview, type SourceSegment } from "./ai";
import { readTranscript } from "./transcript";

export async function processOneJob() {
  const db = adminDb();
  const job = checked(await db.rpc("claim_job"));
  if (!job) return { processed: false };
  try {
    const session = checked(
      await db.from("sessions").select("*").eq("id", job.session_id).single(),
    );
    const segments: SourceSegment[] = await readTranscript(db, session.id);
    let result;
    if (job.kind === "session") result = await createLessonResult(session, segments);
    else {
      const marks = checked(
        await db
          .from("saved_items")
          .select("kind,text,start_seconds,label")
          .eq("user_id", job.user_id)
          .eq("session_id", session.id),
      );
      // Never put other students' private data into this prompt.
      const previousSessions = checked(
        await db
          .from("sessions")
          .select("id,title")
          .eq("course_id", session.course_id)
          .eq("status", "done")
          .is("archived_at", null)
          .lt("starts_at", session.starts_at)
          .order("starts_at", { ascending: false })
          .limit(8),
      );
      const previous = [];
      for (const lesson of previousSessions || []) {
        const prior = checked(
          await db
            .from("session_results")
            .select("notes")
            .eq("session_id", lesson.id)
            .maybeSingle(),
        );
        if (prior) previous.push({ ...lesson, notes: prior.notes });
      }
      result = await createReview(segments, marks || [], previous);
    }
    checked(await db.rpc("complete_job", { jid: job.id, token: job.lease, result }));
    return { processed: true, status: "done" };
  } catch {
    checked(await db.rpc("fail_job", { jid: job.id, token: job.lease }));
    return { processed: true, status: "retry_scheduled" };
  }
}
