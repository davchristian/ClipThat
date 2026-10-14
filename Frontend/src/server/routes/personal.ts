import { z } from "zod";
import { checked, type Db, readSession } from "../db";
import { agendaInput, uuid } from "../schemas";
import { body, json, ApiError } from "../http";
import { required } from "../config";
import { verifyCapture } from "../capture-token";

export async function personalRoute(request: Request, path: string[], db: Db, userId: string) {
  const [resource, id] = path;
  const method = request.method;
  if (resource === "saved") {
    if (!id && method === "GET")
      return json(
        checked(
          await db
            .from("saved_items")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(500),
        ),
      );
    if (id === "capture" && method === "POST") {
      const input = await body(
        request,
        z
          .object({
            token: z.string().max(180000),
            question: z.string().trim().max(1000).optional(),
          })
          .strict(),
      );
      const c = await verifyCapture(input.token, required("CAPTURE_SIGNING_SECRET"), userId);
      await readSession(db, c.session_id);
      const existing = checked(
        await db.from("saved_items").select("*").eq("id", c.id).maybeSingle(),
      );
      if (existing) return json(existing);
      return json(
        checked(
          await db
            .from("saved_items")
            .insert({
              id: c.id,
              user_id: userId,
              session_id: c.session_id,
              kind: "capture",
              title: "Capture",
              text: c.text,
              summary: c.summary,
              question: input.question ?? c.question,
              start_seconds: c.start,
              end_seconds: c.end,
            })
            .select()
            .single(),
        ),
        201,
      );
    }
    uuid.parse(id);
    if (method === "PATCH") {
      const input = await body(
        request,
        z
          .object({
            reviewed: z.boolean().optional(),
            question: z.string().max(1000).optional(),
            label: z.enum(["Bingung", "Review nanti"]).optional(),
          })
          .strict(),
      );
      return json(
        checked(await db.from("saved_items").update(input).eq("id", id).select().single()),
      );
    }
    if (method === "DELETE") {
      const item = checked(await db.from("saved_items").select("*").eq("id", id).single());
      if (item.storage_path) checked(await db.storage.from("photos").remove([item.storage_path]));
      checked(await db.from("saved_items").delete().eq("id", id));
      return json({ deleted: true });
    }
  }
  if (resource === "agenda") {
    if (!id && method === "GET")
      return json(checked(await db.from("agenda").select("*").order("due_at").limit(500)));
    if (!id && method === "POST") {
      const input = await body(request, agendaInput);
      if (input.session_id) await readSession(db, input.session_id);
      return json(
        checked(
          await db
            .from("agenda")
            .insert({ ...input, user_id: userId })
            .select()
            .single(),
        ),
        201,
      );
    }
    uuid.parse(id);
    if (method === "PATCH") {
      const input = await body(
        request,
        agendaInput.omit({ session_id: true, source: true }).partial(),
      );
      return json(
        checked(
          await db
            .from("agenda")
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single(),
        ),
      );
    }
    if (method === "DELETE") {
      checked(await db.from("agenda").delete().eq("id", id));
      return json({ deleted: true });
    }
  }
  throw new ApiError(405, "method_not_allowed", "Metode tidak didukung.");
}
