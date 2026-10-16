import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: ["app.spec.ts", "focus-mode.spec.ts", "qa-audit.spec.ts"],
  outputDir: "test-results/audit",
  use: { ...base.use, baseURL: "http://127.0.0.1:3197" },
  webServer: {
    command: "npm run dev -- --port 3197",
    url: "http://127.0.0.1:3197",
    reuseExistingServer: true,
    timeout: 90000,
    env: {
      NEXT_PUBLIC_APP_MODE: "demo",
      CLIPTHAT_DIST_DIR: ".next-qa-demo",
      GEMINI_API_KEY: "",
      OPENAI_API_KEY: "",
      DEEPGRAM_API_KEY: "",
    },
  },
});
