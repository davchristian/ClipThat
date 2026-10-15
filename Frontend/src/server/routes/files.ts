import { z } from "zod";
import { checked, type Db, readSession } from "../db";
import { uuid, secondsSchema } from "../schemas";
import { ApiError, boundedBody, json, body } from "../http";

export async function filesRoute(request: Request, path: string[], db: Db, userId: string) {
  const [, kind, id, action] = path;
  if (!["materials", "photos"].includes(kind))
    throw new ApiError(404, "not_found", "Jenis berkas tidak ditemukan.");
  const table = kind === "materials" ? "materials" : "saved_items";
  if (id) {
    uuid.parse(id);
    const row = checked(await db.from(table).select("*").eq("id", id).single());
    if (kind === "photos" && row.kind !== "photo")
      throw new ApiError(404, "not_found", "Foto tidak ditemukan.");
    if (request.method === "GET") {
      if (row.archived_at) throw new ApiError(404, "not_found", "Berkas sudah diarsipkan.");
      return json(checked(await db.storage.from(kind).createSignedUrl(row.storage_path, 120)));
    }
    if (
      kind === "materials" &&
      request.method === "POST" &&
      ["archive", "restore"].includes(action)
    ) {
      await body(request, z.object({}).strict());
      checked(await db.rpc("archive_material", { mid: id, restore: action === "restore" }));
      return json({ updated: true });
    }
    throw new ApiError(405, "method_not_allowed", "Metode tidak didukung.");
  }
  if (request.method !== "POST")
    throw new ApiError(405, "method_not_allowed", "Metode tidak didukung.");
  const max = kind === "materials" ? 10_485_760 : 5_242_880;
  const bytes = await boundedBody(request, max + 100000);
  const form = await new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") || "" },
    body: bytes,
  }).formData();
  const sessionId = uuid.parse(form.get("session_id"));
  await readSession(db, sessionId, kind === "materials");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > max)
    throw new ApiError(422, "invalid_file", "Ukuran berkas tidak sesuai batas.");
  const types: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (kind === "materials") {
    types["application/pdf"] = "pdf";
    types["text/plain"] = "txt";
  }
  const extension = types[file.type];
  if (!extension)
    throw new ApiError(
      422,
      "invalid_file",
      "Gunakan PDF atau gambar PNG/JPG/WebP; foto harus berupa gambar.",
    );
  const prefix = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const magic = new TextDecoder().decode(prefix);
  const valid =
    extension === "txt"
      ? !prefix.includes(0)
      : extension === "pdf"
        ? magic.startsWith("%PDF-")
        : extension === "png"
          ? prefix[0] === 137 && magic.slice(1, 4) === "PNG"
          : extension === "jpg"
            ? prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255
            : magic.startsWith("RIFF") && magic.slice(8) === "WEBP";
  if (!valid) throw new ApiError(422, "invalid_file", "Isi berkas tidak cocok dengan jenisnya.");
  const storagePath = `${kind === "materials" ? sessionId : userId}/${crypto.randomUUID()}.${extension}`;
  const at = kind === "photos" ? secondsSchema.parse(Number(form.get("at_seconds"))) : 0;
  checked(
    await db.storage
      .from(kind)
      .upload(storagePath, file, { contentType: file.type, upsert: false }),
  );
  const name = file.name.slice(0, 160) || "Berkas kelas";
  if (kind === "materials")
    return json(
      checked(
        await db
          .from("materials")
          .insert({ session_id: sessionId, name, storage_path: storagePath })
          .select("id,name")
          .single(),
      ),
      201,
    );
  return json(
    checked(
      await db
        .from("saved_items")
        .insert({
          user_id: userId,
          session_id: sessionId,
          kind: "photo",
          title: name,
          storage_path: storagePath,
          start_seconds: at,
          text: "",
        })
        .select()
        .single(),
    ),
    201,
  );
}
