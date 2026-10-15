import { ZodError, type ZodType } from "zod";
import { ConfigError, setting } from "./config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(
    { data },
    {
      status,
      headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}
export function failure(error: unknown) {
  let status = 500,
    code = "internal_error",
    message = "Terjadi gangguan. Coba lagi nanti.";
  if (error instanceof ApiError) ({ status, code, message } = error);
  else if (error instanceof ZodError) {
    status = 422;
    code = "validation_error";
    message = "Input tidak valid. Periksa kembali formulir.";
  } else if (error instanceof ConfigError) {
    status = 503;
    code = "not_configured";
    message = error.message;
  }
  // Do not log passwords, tokens, transcript contents or provider responses.
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}
export function sameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  // Next may normalize the internal URL to localhost behind a proxy. Compare
  // browser Origin with the configured public app origin instead.
  const expected = new URL(setting("APP_URL") || request.url).origin;
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site")
    throw new ApiError(403, "invalid_origin", "Permintaan harus berasal dari aplikasi ClipThat.");
}
export async function boundedBody(request: Request, max = 200_000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > max) throw new ApiError(413, "too_large", "Ukuran data terlalu besar.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new ApiError(413, "too_large", "Ukuran data terlalu besar.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function body<T>(request: Request, schema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "invalid_content_type", "Gunakan application/json.");
  const bytes = await boundedBody(request);
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, "invalid_json", "JSON tidak valid.");
  }
  return schema.parse(parsed);
}
