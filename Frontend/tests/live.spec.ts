import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
const sessionId = "00000000-0000-4000-8000-000000000020";
test.beforeEach(async ({ request }) => {
  await request.get("http://127.0.0.1:54329/reset");
});
test("live login uses auth API, capture waits for confirmation, responsive tabs stay usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("student@test.local");
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  await expect(page.locator(".profile-info")).toContainText("Davin Farel");
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: "Transformasi linear" }) })
    .click();
  await expect(page.getByRole("tab")).toHaveCount(4);
  const draft = {
    id: "00000000-0000-4000-8000-000000000090",
    user_id: "00000000-0000-4000-8000-000000000002",
    session_id: sessionId,
    start: 1020,
    end: 1110,
    text: "Materi transformasi linear",
    summary: "Hasil pemetaan vektor basis membentuk kolom matriks.",
    question: "Bagaimana menentukan kolom matriks?",
    exp: Date.now() + 900000,
  };
  const payload = Buffer.from(JSON.stringify(draft)).toString("base64url");
  const token =
    payload +
    "." +
    createHmac("sha256", "test-signing-secret-".repeat(4)).update(payload).digest("base64url");
  // Only AI preview is mocked here. Save goes through the actual Next route and token verifier.
  await page.route(`**/api/v1/sessions/${sessionId}/capture-preview`, (route) =>
    route.fulfill({ json: { data: { ...draft, token } } }),
  );
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  const preview = page.getByRole("complementary", { name: "Preview capture" });
  await expect(preview).toBeVisible();
  await expect(page.getByRole("button", { name: "Tersimpan (0)" })).toBeVisible();
  const left = (await page.locator(".transcript-panel").boundingBox())!,
    right = (await preview.boundingBox())!;
  expect(Math.abs(left.height - right.height)).toBeLessThan(1);
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(preview).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("tab", { name: "Materi", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Peta konsep", exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  // The incoming mobile sheet must respect the backend save-in-progress guard.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Transkrip", exact: true }).click();
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  const mobilePreview = page.getByRole("dialog", { name: "Preview capture" });
  let releaseSave = () => {};
  const pendingSave = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  await page.route("**/api/v1/saved/capture", async (route) => {
    await pendingSave;
    await route.fulfill({
      status: 503,
      json: { error: { message: "Penyimpanan belum tersedia." } },
    });
  });
  try {
    const saving = page.waitForRequest(
      (request) => request.url().endsWith("/api/v1/saved/capture") && request.method() === "POST",
    );
    await mobilePreview.getByRole("button", { name: "Simpan capture" }).click();
    await saving;
    await expect(mobilePreview.getByRole("button", { name: "Tutup dialog" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(mobilePreview).toBeVisible();
    await expect(mobilePreview).toBeInViewport();
  } finally {
    releaseSave();
  }
  await expect(mobilePreview.getByRole("alert")).toContainText("Penyimpanan belum tersedia.");
  await expect(mobilePreview.getByRole("button", { name: "Simpan capture" })).toBeEnabled();
  await mobilePreview.getByRole("button", { name: "Buang capture", exact: true }).click();
  await expect(mobilePreview).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("live lecturer can end class and student cannot access internal worker", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("dosen@test.local");
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  await page.goto(`/session/${sessionId}`);
  await expect(page.getByRole("tab")).toHaveCount(4);
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("tab", { name: "Materi", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Peta konsep", exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Akhiri kelas", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Akhiri kelas", exact: true }).click();
  await expect(page.locator(".session-meta")).toContainText("processing");
  const denied = await request.post("/api/v1/courses", {
    headers: { Origin: "https://evil.test" },
    data: { name: "Invalid" },
  });
  expect(denied.status()).toBe(403);
  const internal = await request.post("/api/internal/jobs");
  expect([401, 503]).toContain(internal.status());
});
test("first lecturer course creates a course before creating a session", async ({
  page,
  request,
}) => {
  await request.get("http://127.0.0.1:54329/reset?empty=1");
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("dosen@test.local");
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Buat kelas", exact: true }).click();
  await page.getByLabel("Nama mata kuliah", { exact: true }).fill("Kalkulus");
  await page.getByLabel("Topik pertemuan", { exact: true }).fill("Integral pertama");
  await page.getByLabel("Waktu kelas", { exact: true }).fill("2026-10-12T08:00");
  await page.getByRole("button", { name: "Buat pertemuan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Integral pertama", exact: true })).toBeVisible();
});
