import { loadEnvConfig } from "@next/env";
import { setTimeout as delay } from "node:timers/promises";
loadEnvConfig(process.cwd());
async function main() {
  const origin = process.env.APP_URL || "http://127.0.0.1:3000";
  const secret = process.env.JOB_RUNNER_SECRET;
  if (!secret) throw new Error("Isi JOB_RUNNER_SECRET pada .env.local terlebih dahulu.");
  const watch = process.argv.includes("--watch");
  const stop = new AbortController();
  const shutdown = () => stop.abort();
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  let idle = false;
  if (watch)
    console.log(
      "Job runner aktif. Menunggu kelas selesai dan jadwal retry. Ctrl+C untuk berhenti.",
    );
  try {
    for (let i = 0; !stop.signal.aborted && (watch || i < 100); i++) {
      const response = await fetch(new URL("/api/internal/jobs", origin), {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.any([stop.signal, AbortSignal.timeout(150000)]),
      });
      if (!response.ok)
        throw new Error(`Job runner HTTP ${response.status}. Periksa konfigurasi server.`);
      const value = (await response.json()) as {
        data: {
          processed: boolean;
          status?: string;
          study?: {
            processed: boolean;
            status?: string;
            error?: { code: string; message: string };
          };
        };
      };
      if (!value.data.processed) {
        if (!idle)
          console.log(
            "Tidak ada pekerjaan yang siap diproses saat ini (antrean bisa menunggu jadwal retry).",
          );
        if (!watch) break;
        idle = true;
        await delay(5000, undefined, { signal: stop.signal });
        continue;
      }
      idle = false;
      console.log(`Pekerjaan: ${value.data.status}`);
      if (value.data.study?.error) {
        console.error(
          `Catatan: ${value.data.study.status} [${value.data.study.error.code}] ${value.data.study.error.message}`,
        );
        process.exitCode = 1;
      }
    }
  } catch (error) {
    if (!stop.signal.aborted) throw error;
  } finally {
    process.removeListener("SIGINT", shutdown);
    process.removeListener("SIGTERM", shutdown);
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Job runner gagal.");
  process.exitCode = 1;
});
