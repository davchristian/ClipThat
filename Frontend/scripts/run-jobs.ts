import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  const origin = process.env.APP_URL || "http://127.0.0.1:3000";
  const secret = process.env.JOB_RUNNER_SECRET;
  if (!secret) throw new Error("Isi JOB_RUNNER_SECRET pada .env.local terlebih dahulu.");
  for (let i = 0; i < 100; i++) {
    const response = await fetch(new URL("/api/internal/jobs", origin), {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok)
      throw new Error(`Job runner HTTP ${response.status}. Periksa konfigurasi server.`);
    const value = (await response.json()) as {
      data: {
        processed: boolean;
        status?: string;
        study?: { processed: boolean; status?: string; error?: { code: string; message: string } };
        calendar?: { processed: boolean; status?: string };
      };
    };
    if (!value.data.processed) {
      console.log(
        "Tidak ada pekerjaan yang siap diproses saat ini (antrean bisa menunggu jadwal retry).",
      );
      break;
    }
    console.log(`Pekerjaan: ${value.data.status}`);
    if (value.data.study?.error) {
      console.error(
        `Catatan: ${value.data.study.status} [${value.data.study.error.code}] ${value.data.study.error.message}`,
      );
      process.exitCode = 1;
    }
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Job runner gagal.");
  process.exitCode = 1;
});
