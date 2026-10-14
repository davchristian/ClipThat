import { z } from "zod";
import { checked, type Db } from "../db";
import { uuid } from "../schemas";
import { ApiError, body, json } from "../http";
export async function questionRoute(request: Request, path: string[], db: Db) {
  const [, id, action] = path;
  uuid.parse(id);
  if (request.method !== "POST")
    throw new ApiError(405, "method_not_allowed", "Metode tidak didukung.");
  if (action === "support") {
    const input = await body(request, z.object({ support: z.boolean() }).strict());
    checked(await db.rpc("support_question", { qid: id, support: input.support }));
    return json({ updated: true });
  }
  if (action === "answer") {
    const input = await body(
      request,
      z.object({ text: z.string().trim().max(5000), oral: z.boolean().default(false) }).strict(),
    );
    if (!input.text && !input.oral)
      throw new ApiError(422, "validation_error", "Isi jawaban atau tandai sudah dijawab lisan.");
    checked(await db.rpc("answer_question", { qid: id, body: input.text, oral: input.oral }));
    return json({ updated: true });
  }
  throw new ApiError(404, "not_found", "Endpoint tidak ditemukan.");
}
