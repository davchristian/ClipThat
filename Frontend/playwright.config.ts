import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "app.spec.ts",
  outputDir: "test-results/demo",
  timeout: 25000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    channel: "chrome",
    baseURL: "http://127.0.0.1:3187",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { timeout: 15000 },
  },
  webServer: {
    command: "npm run dev -- --port 3187",
    env: {
      NEXT_PUBLIC_APP_MODE: "demo",
      CLIPTHAT_DIST_DIR: ".next-test",
      GEMINI_API_KEY: "",
      OPENAI_API_KEY: "",
    },
    url: "http://127.0.0.1:3187",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
