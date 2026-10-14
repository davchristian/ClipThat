import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "live.spec.ts",
  timeout: 45000,
  workers: 1,
  reporter: "list",
  use: {
    channel: "chrome",
    baseURL: "http://127.0.0.1:3101",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/fixtures/supabase.mjs",
      url: "http://127.0.0.1:54329/health",
      reuseExistingServer: !process.env.CI,
      timeout: 20000,
    },
    {
      command: "npm run dev -- --port 3101",
      url: "http://127.0.0.1:3101/login",
      reuseExistingServer: false,
      timeout: 90000,
      env: {
        NEXT_PUBLIC_APP_MODE: "live",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable",
        CLIPTHAT_DIST_DIR: ".next-live",
        APP_URL: "http://127.0.0.1:3101",
        CAPTURE_SIGNING_SECRET: "test-signing-secret-".repeat(4),
      },
    },
  ],
});
