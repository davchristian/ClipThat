import { z } from "zod";
import { checked, type Db } from "../db";
import { ApiError, body, json } from "../http";
import { beginCalendarOAuth, connectionFor, saveConnection } from "../calendar";
import {
  calendarConfigured,
  listDestinations,
  providerSchema,
  providerRequest,
} from "../calendar-providers";
export async function integrationsRoute(request: Request, path: string[], db: Db, uid: string) {
  const [, name, action] = path;
  if (!name && request.method === "GET") {
    const rows = checked(await db.rpc("calendar_status")) as {
      provider: string;
      destination: string;
      destination_name: string;
      pending: number;
      failed: number;
    }[];
    return json(
      providerSchema.options.map((provider) => ({
        provider,
        configured: calendarConfigured(provider),
        connected: rows.some((r) => r.provider === provider),
        ...rows.find((r) => r.provider === provider),
      })),
    );
  }
  const provider = providerSchema.parse(name);
  if (action === "connect" && request.method === "POST") {
    await body(request, z.object({}).strict());
    if (!calendarConfigured(provider))
      throw new ApiError(
        503,
        "not_configured",
        "Koneksi kalender belum diaktifkan untuk aplikasi ini.",
      );
    return json({ url: await beginCalendarOAuth(uid, provider) });
  }
  if (!action && request.method === "DELETE") {
    checked(await db.rpc("disconnect_calendar", { provider_name: provider }));
    return json({ disconnected: true });
  }
  if (action === "destinations" && request.method === "GET") {
    const { token } = await connectionFor(uid, provider);
    return json(await listDestinations(provider, token));
  }
  if (action === "destination" && request.method === "PUT") {
    const input = await body(request, z.object({ id: z.string().min(1).max(1000) }).strict());
    const { credentials, token } = await connectionFor(uid, provider);
    const target = (await listDestinations(provider, token)).find((t) => t.id === input.id);
    if (!target)
      throw new ApiError(422, "invalid_destination", "Tujuan tidak dapat diakses oleh akun ini.");
    if (provider === "notion") {
      const source = await providerRequest(
        provider,
        token,
        `/data_sources/${encodeURIComponent(target.id)}`,
      );
      if (
        source.properties?.Name?.type !== "title" ||
        source.properties?.Date?.type !== "date" ||
        source.properties?.ClipThatID?.type !== "rich_text"
      )
        throw new ApiError(
          422,
          "invalid_destination",
          "Database Notion perlu kolom Name (title), Date (date), dan ClipThatID (text).",
        );
    }
    await saveConnection(uid, provider, credentials, target.id, target.name);
    checked(await db.rpc("queue_calendar_sync", { provider_name: provider }));
    return json({ saved: true });
  }
  if (action === "sync" && request.method === "POST") {
    await body(request, z.object({}).strict());
    checked(await db.rpc("queue_calendar_sync", { provider_name: provider }));
    return json({ queued: true });
  }
  throw new ApiError(404, "not_found", "Endpoint kalender tidak ditemukan.");
}
