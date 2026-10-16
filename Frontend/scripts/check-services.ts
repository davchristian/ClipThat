import { loadEnvConfig } from "@next/env";
import { adminDb, checked } from "../src/server/db";
import { setting } from "../src/server/config";
import { deepgramToken } from "../src/server/deepgram";
import { gemini } from "../src/server/ai";
import { captureSchema } from "../src/server/schemas";
import { signCapture, verifyCapture } from "../src/server/capture-token";
import { ApiError } from "../src/server/http";

loadEnvConfig(process.cwd());
async function check(name: string, work: () => Promise<unknown>) {
  try {
    await work();
    console.log(`${name}: OK`);
  } catch (e) {
    console.error(
      `${name}: ${e instanceof ApiError ? e.message : "Gagal. Periksa konfigurasi dan koneksi layanan."}`,
    );
    process.exitCode = 1;
  }
}
async function main() {
  await check("Capture signing", async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const secret = setting("CAPTURE_SIGNING_SECRET");
    const token = await signCapture(
      {
        id,
        user_id: id,
        session_id: id,
        start: 0,
        end: 1,
        text: "Materi uji buatan",
        summary: "Uji",
        question: "Apa itu matriks?",
        exp: Date.now() + 60000,
      },
      secret,
    );
    await verifyCapture(token, secret, id);
  });
  console.log(
    `Job runner: ${setting("JOB_RUNNER_SECRET") ? "TERISI (belum menjalankan antrean)" : "KOSONG"}`,
  );
  console.log(
    "Kalender: unduh .ics dan impor manual; tidak membutuhkan API key atau OAuth kalender.",
  );
  if (!process.argv.includes("--online")) {
    console.log(
      "Tambahkan --online untuk memeriksa Supabase, token Deepgram, dan Gemini dengan materi uji buatan.",
    );
    return;
  }
  await check("Supabase server key + tabel profiles", async () => {
    checked(await adminDb().from("profiles").select("id", { head: true }).limit(0));
  });
  await check("Supabase kode gabung course", async () => {
    const result = await adminDb().from("courses").select("id,join_code").limit(0);
    if (result.error?.code === "42703")
      throw new ApiError(
        503,
        "course_codes_not_configured",
        "Jalankan supabase/migrations/202610160002_course_join_codes.sql di SQL Editor Supabase.",
      );
    checked(result);
  });
  await check("Deepgram token sementara", () => deepgramToken());
  await check("Gemini ringkasan uji buatan", () =>
    gemini(captureSchema, "Ringkas materi uji dan buat satu pertanyaan.", {
      text: "Matriks adalah susunan bilangan dalam baris dan kolom.",
    }),
  );
  await check("Status provider Google Sign-In Supabase", async () => {
    const response = await fetch(`${setting("NEXT_PUBLIC_SUPABASE_URL")}/auth/v1/settings`, {
      headers: { apikey: setting("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Auth settings unavailable");
    const result = await response.json();
    console.log(
      `Google Sign-In: ${result.external?.google ? "AKTIF; perlu tes login browser" : "BELUM DIAKTIFKAN DI SUPABASE"}`,
    );
  });
}
main().catch(() => {
  console.error("Pemeriksaan setup gagal.");
  process.exitCode = 1;
});
