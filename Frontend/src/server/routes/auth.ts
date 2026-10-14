import { z } from "zod";
import { sessionDb, authenticated, checked } from "../db";
import { authInput } from "../schemas";
import { body, json, ApiError } from "../http";
import { required } from "../config";

export async function authRoute(request: Request, action: string) {
  if (action === "me" && request.method === "GET") {
    const { db, user } = await authenticated();
    return json(
      checked(await db.from("profiles").select("id,name,role").eq("id", user.id).single()),
    );
  }
  if (request.method !== "POST")
    throw new ApiError(405, "method_not_allowed", "Metode tidak didukung.");
  const db = await sessionDb();
  if (action === "logout") {
    const { error } = await db.auth.signOut();
    if (error) throw new ApiError(500, "logout_failed", "Belum bisa keluar. Coba lagi.");
    return json({ signed_out: true });
  }
  if (!["login", "register"].includes(action))
    throw new ApiError(404, "not_found", "Endpoint tidak ditemukan.");
  const input = await body(request, authInput);
  if (action === "register") {
    const name = z.string().trim().min(2).max(60).parse(input.name);
    const origin = new URL(required("APP_URL")).origin;
    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { name, role: input.role || "student" },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error)
      throw new ApiError(
        400,
        "signup_failed",
        "Akun belum dapat dibuat. Periksa email dan kata sandi.",
      );
    return json({ needs_confirmation: !data.session }, 201);
  }
  const { error } = await db.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error)
    throw new ApiError(
      401,
      "login_failed",
      "Email atau kata sandi salah, atau email belum dikonfirmasi.",
    );
  return json({ signed_in: true });
}
