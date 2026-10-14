import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicConfig, required } from "./config";
import { ApiError } from "./http";

export async function sessionDb() {
  const config = publicConfig();
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) =>
        values.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
}
export async function authenticated() {
  const db = await sessionDb();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user)
    throw new ApiError(401, "unauthenticated", "Silakan masuk terlebih dahulu.");
  return { db, user: data.user };
}
export function adminDb() {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export type Db = Awaited<ReturnType<typeof sessionDb>>;
export async function readSession(db: Db, id: string, owner = false) {
  const session = checked(await db.from("sessions").select("*").eq("id", id).maybeSingle());
  if (!session) throw new ApiError(404, "not_found", "Kelas tidak ditemukan.");
  if (owner) {
    const { data } = await db.auth.getUser();
    const course = checked(
      await db.from("courses").select("owner_id").eq("id", session.course_id).single(),
    );
    if (course?.owner_id !== data.user?.id)
      throw new ApiError(403, "forbidden", "Hanya dosen pembuat kelas yang dapat melakukan ini.");
  }
  return session;
}
export function checked<T>(result: {
  data: T;
  error: { code?: string; message: string } | null;
}): T {
  if (!result.error) return result.data;
  const code = result.error.code;
  if (code === "42501") throw new ApiError(403, "forbidden", "Akses tidak diizinkan.");
  if (code === "P0002" || code === "PGRST116")
    throw new ApiError(404, "not_found", "Data tidak ditemukan.");
  if (code === "23505") throw new ApiError(409, "conflict", "Data sudah ada.");
  if (["22023", "23514", "23503", "22P02"].includes(code || ""))
    throw new ApiError(422, "invalid_state", "Data atau status kelas tidak sesuai.");
  throw new ApiError(500, "database_error", "Data gagal diproses. Coba lagi nanti.");
}
