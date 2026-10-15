import { cookies } from "next/headers";
import { adminDb, checked } from "./db";
import { required } from "./config";
import { ApiError } from "./http";
import { seal, unseal } from "./integration-crypto";
import {
  providerConfig,
  tokenRequest,
  syncEvent,
  type CalendarProvider,
  type Credentials,
  type CalendarAgenda,
} from "./calendar-providers";
export type Connection = {
  user_id: string;
  provider: CalendarProvider;
  credentials: string;
  destination: string;
  destination_name: string;
};
type OAuthState = {
  userId: string;
  provider: CalendarProvider;
  nonce: string;
  verifier: string;
  expires: number;
};
const cookieName = "clipthat-calendar-oauth";
export async function saveConnection(
  uid: string,
  provider: CalendarProvider,
  credentials: Credentials,
  target: string,
  name: string,
) {
  checked(
    await adminDb().rpc("save_calendar_connection", {
      uid,
      provider_name: provider,
      secret: await seal(credentials, `calendar:${uid}:${provider}`),
      target,
      target_name: name,
    }),
  );
}
export async function connectionFor(
  uid: string,
  provider: CalendarProvider,
): Promise<{ connection: Connection; token: string; credentials: Credentials }> {
  const connection = checked(
    await adminDb().rpc("calendar_connection", { uid, provider_name: provider }),
  ) as Connection | null;
  if (!connection)
    throw new ApiError(404, "not_connected", "Hubungkan akun kalender terlebih dahulu.");
  let credentials = await unseal<Credentials>(
    connection.credentials,
    `calendar:${uid}:${provider}`,
  );
  if (credentials.expires_at < Date.now() + 60000) {
    if (!credentials.refresh_token)
      throw new ApiError(
        401,
        "reconnect_required",
        "Koneksi kedaluwarsa. Hubungkan kembali akun kalender.",
      );
    const refreshed = await tokenRequest(provider, {
      grant_type: "refresh_token",
      refresh_token: credentials.refresh_token,
    });
    credentials = {
      ...refreshed,
      refresh_token: refreshed.refresh_token || credentials.refresh_token,
    };
    await saveConnection(
      uid,
      provider,
      credentials,
      connection.destination,
      connection.destination_name,
    );
  }
  return { connection, token: credentials.access_token, credentials };
}
export async function beginCalendarOAuth(uid: string, provider: CalendarProvider) {
  const config = providerConfig(provider);
  const nonce = crypto.randomUUID();
  const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64url");
  const state: OAuthState = {
    userId: uid,
    provider,
    nonce,
    verifier,
    expires: Date.now() + 600000,
  };
  (await cookies()).set(cookieName, await seal(state, "calendar-oauth"), {
    httpOnly: true,
    secure: new URL(required("APP_URL")).protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/integrations",
  });
  const url = new URL(config.authorize);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", nonce);
  if (provider === "notion") url.searchParams.set("owner", "user");
  else {
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set(
      "code_challenge",
      Buffer.from(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
      ).toString("base64url"),
    );
    if (provider === "google") {
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
    }
  }
  return url.toString();
}
export function validateOAuthState(
  state: OAuthState,
  uid: string,
  provider: CalendarProvider,
  nonce: string,
  now = Date.now(),
) {
  if (
    !nonce ||
    state.userId !== uid ||
    state.provider !== provider ||
    state.nonce !== nonce ||
    state.expires < now
  )
    throw new ApiError(
      400,
      "invalid_state",
      "Permintaan koneksi kedaluwarsa. Hubungkan lagi dari pengaturan.",
    );
}
export async function finishCalendarOAuth(
  request: Request,
  uid: string,
  provider: CalendarProvider,
) {
  const jar = await cookies();
  const raw = jar.get(cookieName)?.value;
  jar.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/api/integrations",
  });
  if (!raw) throw new ApiError(400, "invalid_state", "Mulai koneksi dari pengaturan ClipThat.");
  const state = await unseal<OAuthState>(raw, "calendar-oauth");
  const params = new URL(request.url).searchParams;
  validateOAuthState(state, uid, provider, params.get("state") || "");
  const code = params.get("code");
  if (!code || code.length > 10000 || params.has("error"))
    throw new ApiError(400, "consent_declined", "Koneksi belum disetujui.");
  const config = providerConfig(provider);
  const credentials = await tokenRequest(provider, {
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirect,
    ...(provider !== "notion" ? { code_verifier: state.verifier } : {}),
  });
  await saveConnection(uid, provider, credentials, "", "");
}
type CalendarJob = {
  id: string;
  user_id: string;
  agenda_id: string;
  provider: CalendarProvider;
  payload: CalendarAgenda;
  remove: boolean;
  external_id: string | null;
  lease: string;
  version: string;
};
export async function processCalendarJob() {
  const db = adminDb();
  const job = checked(await db.rpc("claim_calendar_job")) as CalendarJob | null;
  if (!job) return { processed: false };
  let external: string | null = null;
  let failed = false;
  try {
    const { connection, token } = await connectionFor(job.user_id, job.provider);
    if (!connection.destination) throw Error("Pilih tujuan kalender.");
    let previous: { id: string; destination: string } | null = null;
    if (job.external_id) {
      try {
        previous = JSON.parse(job.external_id);
      } catch {
        previous = { id: job.external_id, destination: connection.destination };
      }
    }
    if (previous && previous.destination !== connection.destination && !job.remove) {
      await syncEvent(job.provider, token, previous.destination, job.payload, previous.id, true);
      previous = null;
    }
    const id = await syncEvent(
      job.provider,
      token,
      job.remove && previous ? previous.destination : connection.destination,
      job.payload,
      previous?.id || null,
      job.remove,
    );
    external = id ? JSON.stringify({ id, destination: connection.destination }) : null;
  } catch {
    failed = true;
  }
  checked(
    await db.rpc("finish_calendar_job", {
      jid: job.id,
      lease_id: job.lease,
      job_version: job.version,
      remote_id: external,
      failed,
    }),
  );
  return { processed: true, status: failed ? "calendar_retry_scheduled" : "calendar_synced" };
}
