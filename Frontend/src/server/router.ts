import { authenticated, checked } from "./db";
import { setting } from "./config";
import { ApiError, body, failure, json, sameOrigin } from "./http";
import { courseInput } from "./schemas";
import { authRoute } from "./routes/auth";
import { sessionRoute } from "./routes/sessions";
import { personalRoute } from "./routes/personal";
import { questionRoute } from "./routes/questions";
import { filesRoute } from "./routes/files";
import { z } from "zod";
import { integrationsRoute } from "./routes/integrations";

export async function dispatch(request: Request, path: string[]) {
  try {
    sameOrigin(request);
    if (path.length === 1 && path[0] === "health" && request.method === "GET")
      return json({
        status: "ok",
        database_configured:
          !!setting("NEXT_PUBLIC_SUPABASE_URL") &&
          !!setting("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
        ai_configured: !!setting("GEMINI_API_KEY"),
        transcription_configured: !!setting("OPENAI_API_KEY"),
      });
    if (path[0] === "auth" && path.length === 2) return await authRoute(request, path[1]);
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
        profile: checked(profile),
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
    if (path[0] === "integrations") return await integrationsRoute(request, path, db, user.id);
    if (path[0] === "courses" && path.length === 1) {
      if (request.method === "GET")
        return json(checked(await db.from("courses").select("*").order("created_at").limit(500)));
      if (request.method === "POST")
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
    if (path[0] === "sessions" && path.length <= 3)
      return await sessionRoute(request, path, db, user.id);
    if (["saved", "agenda"].includes(path[0]) && path.length <= 2)
      return await personalRoute(request, path, db, user.id);
    if (path[0] === "questions" && path.length === 3) return await questionRoute(request, path, db);
    if (path[0] === "files" && path.length <= 4)
      return await filesRoute(request, path, db, user.id);
    throw new ApiError(404, "not_found", "Endpoint tidak ditemukan.");
  } catch (error) {
    return failure(error);
  }
}
