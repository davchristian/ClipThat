import { z } from "zod";
import { required, setting } from "./config";
import { ApiError } from "./http";
export const providerSchema = z.enum(["outlook", "google", "notion"]);
export type CalendarProvider = z.infer<typeof providerSchema>;
export type Credentials = { access_token: string; refresh_token?: string; expires_at: number };
export type Destination = { id: string; name: string };
export type CalendarAgenda = {
  id: string;
  title: string;
  due_at: string;
  kind: string;
  reminder: boolean;
};
export function providerConfig(provider: CalendarProvider) {
  const origin = new URL(required("APP_URL")).origin;
  const prefix = { outlook: "MICROSOFT", google: "GOOGLE_CALENDAR", notion: "NOTION" }[provider];
  const tenant = setting("MICROSOFT_TENANT_ID") || "common";
  if (!/^[a-zA-Z0-9-]+$/.test(tenant))
    throw new ApiError(503, "invalid_config", "Konfigurasi Microsoft belum valid.");
  return {
    clientId: required(`${prefix}_CLIENT_ID`),
    clientSecret: required(`${prefix}_CLIENT_SECRET`),
    redirect: `${origin}/api/integrations/${provider}/callback`,
    authorize:
      provider === "outlook"
        ? `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
        : provider === "google"
          ? "https://accounts.google.com/o/oauth2/v2/auth"
          : "https://api.notion.com/v1/oauth/authorize",
    token:
      provider === "outlook"
        ? `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
        : provider === "google"
          ? "https://oauth2.googleapis.com/token"
          : "https://api.notion.com/v1/oauth/token",
    scope:
      provider === "outlook"
        ? "openid profile offline_access https://graph.microsoft.com/Calendars.ReadWrite"
        : "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  };
}
export function calendarConfigured(provider: CalendarProvider) {
  try {
    providerConfig(provider);
    return (
      /^[a-fA-F0-9]{64}$/.test(setting("INTEGRATION_ENCRYPTION_KEY")) &&
      !!(setting("SUPABASE_SECRET_KEY") || setting("SUPABASE_SERVICE_ROLE_KEY"))
    );
  } catch {
    return false;
  }
}
export async function tokenRequest(
  provider: CalendarProvider,
  values: Record<string, string>,
  fetcher: typeof fetch = fetch,
): Promise<Credentials> {
  const config = providerConfig(provider);
  const notion = provider === "notion";
  const response = await fetcher(config.token, {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: {
      "Content-Type": notion ? "application/json" : "application/x-www-form-urlencoded",
      ...(notion
        ? {
            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
          }
        : {}),
    },
    body: notion
      ? JSON.stringify(values)
      : new URLSearchParams({
          ...values,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
  });
  if (!response.ok)
    throw new ApiError(
      502,
      "calendar_auth_failed",
      "Akun belum dapat dihubungkan. Periksa izin lalu coba lagi.",
    );
  const token = z
    .object({
      access_token: z.string().min(1),
      refresh_token: z.string().optional(),
      expires_in: z.number().optional(),
    })
    .parse(await response.json());
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + (token.expires_in ?? (notion ? 31536000 : 3600)) * 1000,
  };
}
export async function providerRequest(
  provider: CalendarProvider,
  token: string,
  path: string,
  method = "GET",
  payload?: unknown,
  fetcher: typeof fetch = fetch,
) {
  const base =
    provider === "outlook"
      ? "https://graph.microsoft.com/v1.0"
      : provider === "google"
        ? "https://www.googleapis.com/calendar/v3"
        : "https://api.notion.com/v1";
  const response = await fetcher(`${base}${path}`, {
    method,
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(provider === "notion" ? { "Notion-Version": "2025-09-03" } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  if (method === "DELETE" && [404, 410].includes(response.status)) return null;
  if (!response.ok)
    throw new ApiError(
      502,
      "calendar_failed",
      "Sinkronisasi belum berhasil. Periksa koneksi akun dan tujuan agenda.",
    );
  return response.status === 204 ? null : await response.json();
}
export async function listDestinations(
  provider: CalendarProvider,
  token: string,
): Promise<Destination[]> {
  if (provider === "outlook") {
    const value = await providerRequest(
      provider,
      token,
      "/me/calendars?$select=id,name,canEdit&$top=100",
    );
    return value.value
      .filter((c: { canEdit: boolean }) => c.canEdit)
      .map((c: Destination) => ({ id: c.id, name: c.name }));
  }
  if (provider === "google") {
    const value = await providerRequest(
      provider,
      token,
      "/users/me/calendarList?minAccessRole=writer&maxResults=250",
    );
    return value.items.map((c: { id: string; summary: string }) => ({ id: c.id, name: c.summary }));
  }
  const value = await providerRequest(provider, token, "/search", "POST", {
    filter: { property: "object", value: "data_source" },
    page_size: 100,
  });
  return value.results.map((c: { id: string; title?: { plain_text: string }[] }) => ({
    id: c.id,
    name: c.title?.map((t) => t.plain_text).join("") || "Agenda Notion",
  }));
}
export function eventPayload(provider: CalendarProvider, agenda: CalendarAgenda) {
  const start = new Date(agenda.due_at).toISOString();
  const end = new Date(+new Date(start) + 15 * 60000).toISOString();
  if (provider === "outlook")
    return {
      subject: agenda.title,
      body: { contentType: "text", content: `${agenda.kind} · ClipThat` },
      start: { dateTime: start.slice(0, -1), timeZone: "UTC" },
      end: { dateTime: end.slice(0, -1), timeZone: "UTC" },
      isReminderOn: agenda.reminder,
      reminderMinutesBeforeStart: 1440,
    };
  if (provider === "google")
    return {
      summary: agenda.title,
      description: `${agenda.kind} · ClipThat`,
      start: { dateTime: start },
      end: { dateTime: end },
      reminders: {
        useDefault: false,
        overrides: agenda.reminder ? [{ method: "popup", minutes: 1440 }] : [],
      },
    };
  return {
    properties: {
      Name: { title: [{ text: { content: agenda.title } }] },
      Date: { date: { start } },
      ClipThatID: { rich_text: [{ text: { content: agenda.id } }] },
    },
  };
}
export async function syncEvent(
  provider: CalendarProvider,
  token: string,
  destination: string,
  agenda: CalendarAgenda,
  remoteId: string | null,
  remove: boolean,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  const req = (path: string, method = "GET", value?: unknown) =>
    providerRequest(provider, token, path, method, value, fetcher);
  if (provider === "notion") {
    if (remove) {
      if (remoteId)
        await req(`/pages/${encodeURIComponent(remoteId)}`, "PATCH", { archived: true });
      return null;
    }
    const payload = eventPayload(provider, agenda);
    if (remoteId) {
      await req(`/pages/${encodeURIComponent(remoteId)}`, "PATCH", payload);
      return remoteId;
    }
    const existing = await req(`/data_sources/${encodeURIComponent(destination)}/query`, "POST", {
      filter: { property: "ClipThatID", rich_text: { equals: agenda.id } },
      page_size: 1,
    });
    if (existing.results?.[0]?.id) {
      const id = existing.results[0].id;
      await req(`/pages/${id}`, "PATCH", payload);
      return id;
    }
    return (
      await req("/pages", "POST", {
        parent: { type: "data_source_id", data_source_id: destination },
        ...payload,
      })
    ).id;
  }
  const prefix =
    provider === "outlook"
      ? `/me/calendars/${encodeURIComponent(destination)}/events`
      : `/calendars/${encodeURIComponent(destination)}/events`;
  if (remove) {
    if (remoteId) await req(`${prefix}/${encodeURIComponent(remoteId)}`, "DELETE");
    return null;
  }
  const payload = eventPayload(provider, agenda);
  if (remoteId) {
    await req(`${prefix}/${encodeURIComponent(remoteId)}`, "PATCH", payload);
    return remoteId;
  }
  const id = agenda.id.replace(/-/g, "");
  if (provider === "google") {
    const response = await fetcher(`https://www.googleapis.com/calendar/v3${prefix}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, id }),
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 409) {
      await req(`${prefix}/${id}`, "PATCH", payload);
      return id;
    }
    if (!response.ok)
      throw new ApiError(502, "calendar_failed", "Agenda belum dapat disinkronkan.");
    return (await response.json()).id;
  }
  return (await req(prefix, "POST", { ...payload, transactionId: agenda.id })).id;
}
