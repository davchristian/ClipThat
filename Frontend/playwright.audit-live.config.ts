import { defineConfig } from "@playwright/test";
import base from "./playwright.live.config";

export default defineConfig({
  ...base,
  testMatch: ["live.spec.ts", "qa-live-audit.spec.ts"],
  outputDir: "test-results/audit-live-recheck",
  webServer: (Array.isArray(base.webServer) ? base.webServer : [base.webServer!]).map((server) => ({
    ...server,
    reuseExistingServer: true,
  })),
});
