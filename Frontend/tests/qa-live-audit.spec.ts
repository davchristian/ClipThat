import { test, expect } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";

const sid = "00000000-0000-4000-8000-000000000020";
test.beforeEach(async ({ request, page }) => {
  await request.get("http://127.0.0.1:54339/reset");
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("student@test.local");
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.locator(".profile-info")).toContainText("Davin Farel");
});

test("QA live capture persists through the current Notes UI and retains preview on a save error", async ({
  page,
}) => {
  await page.goto(`/session/${sid}`);
  await page.route(`**/api/v1/sessions/${sid}/capture-preview`, (route) => {
    const draft = {
      id: randomUUID(),
      user_id: "00000000-0000-4000-8000-000000000002",
      session_id: sid,
      start: 1020,
      end: 1110,
      text: "Transkrip sumber",
      summary: "Vektor basis membentuk kolom matriks.",
      question: "Bagaimana menentukan kolom matriks?",
      exp: Date.now() + 900000,
    };
    const body = Buffer.from(JSON.stringify(draft)).toString("base64url");
    const token = `${body}.${createHmac("sha256", "test-signing-secret-".repeat(4)).update(body).digest("base64url")}`;
    return route.fulfill({ json: { data: { ...draft, token } } });
  });
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  const preview = page.getByRole("complementary", { name: "Preview capture" });
  await preview.getByRole("button", { name: "Buang preview capture" }).click();
  expect((await (await page.request.get("/api/v1/saved")).json()).data).toHaveLength(0);
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(preview).toHaveCount(0);
  expect((await (await page.request.get("/api/v1/saved")).json()).data).toHaveLength(1);
  await page.goto(`/session/${sid}?tab=notes`);
  await expect(page.locator(".saved-preview").filter({ hasText: "Capture" })).toBeVisible();
  await page.reload();
  await expect(page.locator(".saved-preview").filter({ hasText: "Capture" })).toBeVisible();
  await page.goto(`/session/${sid}?tab=transcript`);
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await page.route("**/api/v1/saved/capture", (route) =>
    route.fulfill({ status: 503, json: { error: { message: "Penyimpanan belum tersedia." } } }),
  );
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(page.locator(".toast")).toContainText("Penyimpanan belum tersedia.");
  await expect(preview).toBeVisible();
});

test("QA generated agenda draft remains reachable for the student to complete", async ({
  page,
}) => {
  await page.request.get("http://127.0.0.1:54339/reset?processed=1");
  await page.goto("/agenda");
  const boot = (await (await page.request.get("/api/v1/boot")).json()).data;
  expect(boot.results[0].agenda_drafts).toHaveLength(1);
  await expect(page.getByText("Latihan matriks", { exact: true })).toBeVisible();
});

test("QA private note saves and survives reload with fresh content", async ({ page }) => {
  const text = `Ulangi basis dahulu. QA ${Date.now()}`;
  await page.goto(`/session/${sid}?tab=notes`);
  await page.getByText("Catatan pribadi", { exact: true }).click();
  await page.getByLabel("Catatan pribadimu").fill(text);
  await page.getByRole("button", { name: "Simpan catatan", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("tersimpan");
  await page.reload();
  await page.getByText("Catatan pribadi", { exact: true }).click();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveValue(text);
});

for (const width of [1440, 390]) {
  test(`chapter preview is left-only and subsection opens its exact source at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.request.get("http://127.0.0.1:54339/reset?processed=1");
    await page.route(`**/api/v1/sessions/${sid}`, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.results.graph = {
        nodes: [
          {
            id: "chapter-matrix",
            title: "Matriks",
            description:
              "Rangkuman bab: matriks merepresentasikan transformasi linear dan kolomnya berasal dari vektor basis.",
            topics: ["Vektor basis", "Representasi matriks"],
            source_ids: [body.data.transcript[0].id, body.data.transcript[1].id],
            sections: [
              { title: "Vektor basis", source_ids: [body.data.transcript[0].id] },
              { title: "Representasi matriks", source_ids: [body.data.transcript[1].id] },
            ],
          },
        ],
        edges: [],
      };
      await route.fulfill({ response, json: body });
    });
    await page.goto(`/session/${sid}?tab=materials&view=graph`);
    await page.locator(".graph-topic-card").click();
    const preview = page.locator(".graph-node-detail");
    await expect(preview).toContainText("Rangkuman bab:");
    await expect(page.getByLabel("Pilih subbab")).toHaveCount(0);
    await expect(page.locator(".graph-footer")).toHaveCount(0);
    const detail = (await preview.boundingBox())!;
    const viewport = (await page.locator(".graph-viewport").boundingBox())!;
    if (width > 1100) expect(detail.x + detail.width).toBeLessThanOrEqual(viewport.x + 1);
    else expect(detail.y).toBeCloseTo(viewport.y);
    await expect(preview).toBeInViewport();
    await page.screenshot({ path: `docs/qa/2026-10-16/fixes/graph-${width}.png`, fullPage: true });
    await preview.getByRole("button", { name: "Representasi matriks", exact: true }).click();
    await expect(page).toHaveURL(/tab=transcript&source=00000000-0000-4000-8000-000000000101/);
    await expect(page.locator("#segment-00000000-0000-4000-8000-000000000101")).toBeInViewport();
  });
}
