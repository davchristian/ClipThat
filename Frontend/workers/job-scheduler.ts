type Env = { APP_URL: string; JOB_RUNNER_SECRET: string };
export default {
  async scheduled(
    _event: unknown,
    env: Env,
    context: { waitUntil(promise: Promise<unknown>): void },
  ) {
    context.waitUntil(
      (async () => {
        // A DB lease prevents duplicate processing when cron invocations overlap.
        // Drain a small batch so private reviews don't wait one minute per student.
        for (let i = 0; i < 4; i++) {
          const response = await fetch(new URL("/api/internal/jobs", env.APP_URL), {
            method: "POST",
            headers: { Authorization: `Bearer ${env.JOB_RUNNER_SECRET}` },
            signal: AbortSignal.timeout(120000),
          });
          if (!response.ok) throw new Error(`ClipThat job runner HTTP ${response.status}`);
          const value = (await response.json()) as { data: { processed: boolean } };
          if (!value.data.processed) break;
        }
      })(),
    );
  },
};
