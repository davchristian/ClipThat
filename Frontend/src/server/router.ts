import { authenticated, checked } from "./db";
import { setting } from "./config";
import { ApiError, body, failure, json, sameOrigin } from "./http";
import { z } from "zod";
import { supabaseConfigError } from "../lib/supabase-config";

export async function dispatch(request: Request, path: string[]) {
  try {
    sameOrigin(request);
    if (path.length === 1 && path[0] === "health" && request.method === "GET") {
      const { transcriptionConfigured, transcriptionProvider } =
        await import("./transcription-config");
      return json({
        status: "ok",
        database_configured: !supabaseConfigError(
          setting("NEXT_PUBLIC_SUPABASE_URL"),
          setting("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
        ),
        ai_configured: !!setting("GEMINI_API_KEY"),
        transcription_configured: transcriptionConfigured(),
        transcription_provider: transcriptionProvider(),
      });
    }
    if (path[0] === "auth" && path.length === 2) {
      const { authRoute } = await import("./routes/auth");
      return await authRoute(request, path[1]);
    }
    const { db, user } = await authenticated();
    if (path[0] === "boot" && path.length === 1 && request.method === "GET") {
      const [profile, courses, sessions, saved, agenda, results, questions] = await Promise.all([
        db
          .from("profiles")
          .select("id,name,role,onboarded,handled_notifications")
          .eq("id", user.id)
          .single(),
        db.from("courses").select("*").order("created_at").limit(500),
        db.from("sessions").select("*").order("starts_at", { ascending: false }).limit(500),
        db.from("saved_items").select("*").order("created_at", { ascending: false }).limit(500),
        db.from("agenda").select("*").order("due_at").limit(500),
        db.from("session_results").select("session_id,notes,graph,agenda_drafts").limit(500),
        db.rpc("list_my_questions"),
      ]);
      return json({
        profile: { ...checked(profile), ...(user.email ? { email: user.email } : {}) },
        courses: checked(courses),
        sessions: checked(sessions),
        saved: checked(saved),
        agenda: checked(agenda),
        results: checked(results),
        questions: checked(questions),
        handled_notifications: checked(profile)?.handled_notifications || [],
      });
    }
    if (path[0] === "notifications" && request.method === "PUT") {
      const input = await body(
        request,
        z.object({ ids: z.array(z.string().max(10000)).max(500) }).strict(),
      );
      checked(await db.rpc("handle_notifications", { identifiers: input.ids }));
      return json({ saved: true });
    }
    if (path[0] === "integrations")
      throw new ApiError(
        410,
        "manual_calendar_export",
        "Unduh kalender (.ics) dari halaman Agenda lalu impor ke kalender pilihanmu.",
      );
    if (
      path[0] === "courses" &&
      path[1] === "join" &&
      path.length === 2 &&
      request.method === "POST"
    ) {
      const input = await body(
        request,
        z
          .object({
            code: z
              .string()
              .trim()
              .toUpperCase()
              .regex(/^[A-Z0-9]{10}$/),
          })
          .strict(),
      );
      if (!checked(await db.rpc("consume_limit", { action: "join" })))
        throw new ApiError(429, "rate_limited", "Terlalu banyak permintaan. Tunggu satu menit.");
      return json({ id: checked(await db.rpc("join_course", { code: input.code })) });
    }
    if (path[0] === "courses" && path.length === 1) {
      if (request.method === "GET")
        return json(checked(await db.from("courses").select("*").order("created_at").limit(500)));
      if (request.method === "POST") {
        const { courseInput } = await import("./schemas");
        return json(
          checked(
            await db
              .from("courses")
              .insert({ ...(await body(request, courseInput)), owner_id: user.id })
              .select()
              .single(),
          ),
          201,
        );
      }
    }
    if (path[0] === "sessions" && path.length <= 3) {
      const { sessionRoute } = await import("./routes/sessions");
      return await sessionRoute(request, path, db, user.id);
    }
    if (["saved", "agenda"].includes(path[0]) && path.length <= 2) {
      const { personalRoute } = await import("./routes/personal");
      return await personalRoute(request, path, db, user.id);
    }
    if (path[0] === "questions" && path.length === 3) {
      const { questionRoute } = await import("./routes/questions");
      return await questionRoute(request, path, db);
    }
    if (path[0] === "files" && path.length <= 4) {
      const { filesRoute } = await import("./routes/files");
      return await filesRoute(request, path, db, user.id);
    }
    throw new ApiError(404, "not_found", "Endpoint tidak ditemukan.");
  } catch (error) {
    return failure(error);
  }
}
