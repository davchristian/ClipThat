import { z } from "zod";
import { checked, type Db, readSession } from "../db";
import {
  uuid,
  sessionInput,
  transcriptInput,
  questionInput,
  graphSchema,
  secondsSchema,
} from "../schemas";
import { body, boundedBody, json, ApiError } from "../http";
import { captureWindow, summarizeCapture } from "../ai";
import { transcribeAudio, validateAudio, transcriptionProvider } from "../transcription";
import { deepgramToken } from "../deepgram";
import { signCapture } from "../capture-token";
import { required } from "../config";
import { readTranscript } from "../transcript";

async function limit(db: Db, action: string) {
  if (!checked(await db.rpc("consume_limit", { action })))
    throw new ApiError(429, "rate_limited", "Terlalu banyak permintaan. Tunggu satu menit.");
}
export async function sessionRoute(request: Request, path: string[], db: Db, userId: string) {
  const [, id, resource] = path;
  const method = request.method;
  if (!id) {
    if (method === "GET")
      return json(
        checked(
          await db.from("sessions").select("*").order("starts_at", { ascending: false }).limit(500),
        ),
      );
    if (method === "POST")
      return json(
        checked(
          await db
            .from("sessions")
            .insert(await body(request, sessionInput))
            .select()
            .single(),
        ),
        201,
      );
  }
  if (id === "join" && method === "POST") {
    const input = await body(
      request,
      z
        .object({
          code: z
            .string()
            .trim()
            .regex(/^[A-Za-z0-9]{6,12}$/),
        })
        .strict(),
    );
    await limit(db, "join");
    return json({ id: checked(await db.rpc("join_session", { code: input.code })) });
  }
  uuid.parse(id);
  const lesson = await readSession(db, id);
  if (resource === "speech-token" && method === "POST") {
    await readSession(db, id, true);
    if (lesson.status !== "live" || lesson.archived_at)
      throw new ApiError(409, "invalid_state", "Kelas harus sedang berlangsung.");
    if (transcriptionProvider() !== "deepgram")
      throw new ApiError(
        409,
        "invalid_provider",
        "Pilih Deepgram pada konfigurasi transkripsi server.",
      );
    await limit(db, "transcribe");
    return json(await deepgramToken());
  }
  if (!resource && method === "GET") {
    const [transcript, questions, results, materials, notes, review] = await Promise.all([
      readTranscript(db, id),
      db.rpc("list_questions", { sid: id }),
      db.from("session_results").select("*").eq("session_id", id).maybeSingle(),
      db.from("materials").select("id,name,archived_at").eq("session_id", id),
      db
        .from("personal_notes")
        .select("text")
        .eq("session_id", id)
        .eq("user_id", userId)
        .maybeSingle(),
      db
        .from("personal_reviews")
        .select("content")
        .eq("session_id", id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return json({
      session: lesson,
      transcript,
      questions: checked(questions),
      results: checked(results),
      materials: checked(materials),
      personal_note: checked(notes)?.text || "",
      review: checked(review)?.content || null,
    });
  }
  if (["start", "end", "retry", "archive", "restore"].includes(resource) && method === "POST")
    return json(checked(await db.rpc("session_action", { sid: id, action: resource })));
  if (resource === "transcript") {
    if (method === "GET") return json(await readTranscript(db, id));
    if (method === "POST") {
      const input = await body(request, transcriptInput);
      await limit(db, "transcribe");
      checked(
        await db.rpc("append_transcript", {
          sid: id,
          chunk: input.chunk_id,
          segments: input.segments,
        }),
      );
      return json({ saved: true });
    }
  }
  if (resource === "transcribe" && method === "POST") {
    await readSession(db, id, true);
    if (lesson.status !== "live" || lesson.archived_at)
      throw new ApiError(409, "invalid_state", "Kelas harus sedang berlangsung.");
    await limit(db, "transcribe");
    const bytes = await boundedBody(request, 5_500_000);
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") || "" },
      body: bytes,
    }).formData();
    const chunkId = uuid.parse(form.get("chunk_id"));
    const offset = secondsSchema.parse(Number(form.get("offset")));
    const duration = z
      .number()
      .min(0.1)
      .max(90)
      .parse(Number(form.get("duration")));
    const file = form.get("file");
    validateAudio(file);
    const existing = checked(
      await db
        .from("transcript_segments")
        .select("id")
        .eq("session_id", id)
        .eq("chunk_id", chunkId)
        .limit(1),
    );
    if (existing?.length) return json({ saved: true, duplicate: true });
    const segments = await transcribeAudio(file, offset, duration);
    if (segments.length)
      checked(await db.rpc("append_transcript", { sid: id, chunk: chunkId, segments }));
    return json({ saved: true, segments: segments.length });
  }
  if (resource === "capture-preview" && method === "POST") {
    const input = await body(request, z.object({ end: secondsSchema.optional() }).strict());
    if (lesson.archived_at) throw new ApiError(409, "invalid_state", "Kelas telah diarsipkan.");
    const profile = checked(await db.from("profiles").select("role").eq("id", userId).single());
    if (profile?.role !== "student")
      throw new ApiError(403, "forbidden", "Capture pribadi tersedia untuk mahasiswa.");
    await limit(db, "capture");
    const source = await readTranscript(db, id);
    const latest = Math.max(0, ...source.map((s) => s.end_seconds));
    const end = Math.min(input.end ?? latest, latest);
    const window = captureWindow(source, end);
    if (window.text.length > 60000)
      throw new ApiError(422, "capture_too_large", "Cuplikan terlalu panjang untuk diproses.");
    const result = await summarizeCapture(window.segments);
    const claims = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: id,
      start: window.start,
      end: window.end,
      text: window.text,
      ...result,
      exp: Date.now() + 15 * 60 * 1000,
    };
    // Deliberately no database write here; discard requires no DELETE.
    return json({
      ...claims,
      token: await signCapture(claims, required("CAPTURE_SIGNING_SECRET")),
    });
  }
  if (resource === "bookmarks" && method === "POST") {
    const input = await body(
      request,
      z
        .object({
          segment_id: uuid,
          label: z.enum(["Bingung", "Review nanti"]).default("Review nanti"),
        })
        .strict(),
    );
    const segment = checked(
      await db
        .from("transcript_segments")
        .select("*")
        .eq("id", input.segment_id)
        .eq("session_id", id)
        .single(),
    );
    const existing = checked(
      await db
        .from("saved_items")
        .select("id")
        .eq("session_id", id)
        .eq("kind", "bookmark")
        .eq("start_seconds", segment.start_seconds)
        .maybeSingle(),
    );
    if (existing) {
      checked(await db.from("saved_items").update({ label: input.label }).eq("id", existing.id));
      return json(existing);
    }
    return json(
      checked(
        await db
          .from("saved_items")
          .insert({
            user_id: userId,
            session_id: id,
            kind: "bookmark",
            title: "Bagian ditandai",
            text: segment.text,
            start_seconds: segment.start_seconds,
            label: input.label,
          })
          .select()
          .single(),
      ),
      201,
    );
  }
  if (resource === "questions") {
    if (method === "GET") return json(checked(await db.rpc("list_questions", { sid: id })));
    if (method === "POST") {
      const input = await body(request, questionInput);
      await limit(db, "question");
      return json(
        {
          id: checked(
            await db.rpc("ask_question", {
              sid: id,
              body: input.text,
              at_seconds: input.at_seconds,
            }),
          ),
        },
        201,
      );
    }
  }
  if (resource === "personal-note" && method === "PUT") {
    const input = await body(request, z.object({ text: z.string().max(50000) }).strict());
    checked(
      await db.from("personal_notes").upsert({ user_id: userId, session_id: id, text: input.text }),
    );
    return json({ saved: true });
  }
  if (resource === "graph" && method === "PUT") {
    const graph = await body(request, graphSchema);
    const sources = new Set((await readTranscript(db, id)).map((s) => s.id));
    if (
      graph.nodes.some(
        (n) =>
          n.source_ids.some((s) => !sources.has(s)) ||
          n.sections?.some((section) => section.source_ids.some((s) => !sources.has(s))),
      )
    )
      throw new ApiError(422, "invalid_source", "Sumber graph tidak tersedia pada sesi ini.");
    checked(await db.rpc("correct_graph", { sid: id, content: graph }));
    return json({ saved: true });
  }
  if (resource === "confusion" && method === "GET") {
    await readSession(db, id, true);
    return json(checked(await db.rpc("confusion_summary", { sid: id })));
  }
  throw new ApiError(405, "method_not_allowed", "Metode tidak didukung.");
}
