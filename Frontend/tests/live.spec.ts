import { test, expect } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
const sid = "00000000-0000-4000-8000-000000000020";
test.beforeEach(async ({ request }) => {
  await request.get("http://127.0.0.1:54339/reset");
});
async function login(page: import("@playwright/test").Page, teacher = false) {
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(teacher ? "dosen@test.local" : "student@test.local");
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.locator(".profile-info")).toContainText(
    teacher ? "Nadia Putri" : "Davin Farel",
  );
}
test("live email login uses Supabase and rejects invalid credentials without opening the dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("student@test.local");
  await page.getByLabel("Kata sandi", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.locator(".field-error[role=alert]")).toContainText(
    "Email atau kata sandi salah",
  );
  await expect(page).toHaveURL(/login/);
  await login(page);
  await expect(page.getByRole("button", { name: "Pilih peran demo" })).toHaveCount(0);
});
test("live capture discard makes no save request; confirmation uses the real signed-token save route", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/session/${sid}`);
  await expect(page.locator(".transcript-segment")).toHaveCount(8);
  let writes = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/saved/capture") && r.method() === "POST") writes++;
  });
  const draft = {
    id: "00000000-0000-4000-8000-000000000090",
    user_id: "00000000-0000-4000-8000-000000000002",
    session_id: sid,
    start: 1020,
    end: 1110,
    text: "Transkrip sumber",
    summary: "Vektor basis membentuk kolom matriks.",
    question: "Bagaimana menentukan kolom matriks?",
    exp: Date.now() + 900000,
  };
  const payload = Buffer.from(JSON.stringify(draft)).toString("base64url");
  const token = `${payload}.${createHmac("sha256", "test-signing-secret-".repeat(4)).update(payload).digest("base64url")}`;
  await page.route(`**/api/v1/sessions/${sid}/capture-preview`, (r) => {
    const fresh = { ...draft, id: randomUUID() };
    const body = Buffer.from(JSON.stringify(fresh)).toString("base64url");
    const signed = `${body}.${createHmac("sha256", "test-signing-secret-".repeat(4)).update(body).digest("base64url")}`;
    return r.fulfill({ json: { data: { ...fresh, token: signed } } });
  });
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  const preview = page.getByRole("complementary", { name: "Preview capture" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Buang preview capture" }).click();
  expect(writes).toBe(0);
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  expect(writes).toBe(1);
  await page.reload();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await expect(preview).toBeInViewport();
  await page.route("**/api/v1/saved/capture", (r) =>
    r.fulfill({ status: 503, json: { error: { message: "Penyimpanan belum tersedia." } } }),
  );
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(page.locator(".toast")).toContainText("Penyimpanan belum tersedia.");
  await expect(preview).toBeVisible();
});
test("live question and private note persist through the API, and unconfigured calendars stay disconnected", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/session/${sid}?tab=questions`);
  await page.getByLabel("Pertanyaan anonim").fill("Mengapa matriks memakai vektor basis?");
  await page.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(page.locator(".question-card")).toContainText("Mengapa matriks");
  await page.reload();
  await expect(page.locator(".question-card")).toContainText("Mengapa matriks");
  await page.getByRole("button", { name: "Catatan", exact: true }).click();
  await page.getByText("Catatan pribadi", { exact: true }).click();
  await page.getByLabel("Catatan pribadimu").fill("Ulangi basis dahulu.");
  await page.getByRole("button", { name: "Simpan catatan", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("tersimpan");
  await page.reload();
  await page.getByText("Catatan pribadi", { exact: true }).click();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveValue("Ulangi basis dahulu.");
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: "Hubungkan" })).toHaveCount(3);
  for (const button of await page.getByRole("button", { name: "Hubungkan" }).all())
    await expect(button).toBeDisabled();
});
test("live lecturer creates the first course and session; student requests cannot run the worker", async ({
  page,
  request,
}) => {
  await request.get("http://127.0.0.1:54339/reset?empty=1");
  await login(page, true);
  await page.goto("/classes");
  await page.getByRole("button", { name: "Buat sesi", exact: true }).click();
  await page.getByLabel("Nama mata kuliah", { exact: true }).fill("Aljabar Baru");
  await page.getByLabel("Topik pertemuan", { exact: true }).fill("Nilai eigen");
  await page.getByRole("button", { name: "Buat sesi kelas" }).click();
  await expect(page.getByRole("heading", { name: "Nilai eigen", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mulai kelas", exact: true }).click();
  await expect(page.getByText("Live", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Akhiri", exact: true }).click();
  await page.getByRole("button", { name: "Selesaikan kelas" }).click();
  await expect(page.getByRole("heading", { name: "Menyiapkan catatan…" })).toBeVisible();
  const bad = await request.post("/api/v1/courses", {
    headers: { Origin: "https://evil.test" },
    data: { name: "Injected" },
  });
  expect(bad.status()).toBe(403);
  const worker = await request.post("/api/internal/jobs");
  expect([401, 503]).toContain(worker.status());
});

test("generated class graph links to its transcript and agenda confirmation survives reload", async ({
  page,
  request,
}) => {
  await request.get("http://127.0.0.1:54339/reset?processed=1");
  await login(page);
  await page.goto(`/session/${sid}?tab=materials&view=graph`);
  await expect(
    page.locator(".graph-topic-card").filter({ hasText: "Matriks" }).locator("span"),
  ).toHaveText("Kolom matriks");
  await page.getByLabel("Pilih subbab").selectOption("matrix");
  await expect(page.locator(".graph-node-detail")).toContainText(
    "Kolom dari hasil pemetaan basis.",
  );
  await page.getByRole("button", { name: "Buka pembahasan" }).click();
  await expect(page).toHaveURL(/tab=transcript&source=/);
  await expect(page.locator("#segment-00000000-0000-4000-8000-000000000101")).toBeInViewport();
  await page.goto("/agenda");
  const draft = page.locator(".agenda-draft:visible").filter({ hasText: "Latihan matriks" });
  await expect(draft).toBeVisible();
  await draft.getByRole("button", { name: "Tinjau" }).click();
  await page.getByRole("button", { name: "Konfirmasi agenda", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(draft).toHaveCount(0);
  const response = await page.request.get("/api/v1/agenda");
  const body = await response.json();
  expect(body.data).toHaveLength(1);
  expect(body.data[0].confirmed).toBe(true);
  expect(body.data[0].source.draft_key).toBe(`${sid}:0`);
  await page.request.post("/api/v1/auth/logout", {
    headers: { Origin: "http://127.0.0.1:3188" },
    data: {},
  });
  await login(page, true);
  await page.goto(`/session/${sid}?tab=materials&view=graph`);
  await page.getByRole("button", { name: "Koreksi hubungan" }).click();
  await page.getByLabel("Jenis hubungan").selectOption("penerapan");
  await page.getByRole("button", { name: "Simpan hubungan" }).click();
  await expect(page.locator(".toast")).toContainText("Hubungan diperbarui");
  await page.reload();
  await expect(
    page.locator(".graph-topic-card").filter({ hasText: "Matriks" }).locator("span"),
  ).toHaveText("Kolom matriks");
  await page.getByLabel("Pilih subbab").selectOption("matrix");
  await expect(page.locator(".graph-node-detail")).toContainText(
    "Kolom dari hasil pemetaan basis.",
  );
  await expect(page.locator(".graph-relations")).toContainText("penerapan");
});

test("Deepgram shows interim speech, persists finals on stop and protects the token endpoint", async ({
  page,
}) => {
  await login(page);
  const denied = await page.request.post(`/api/v1/sessions/${sid}/speech-token`, {
    headers: { origin: "http://127.0.0.1:3188" },
  });
  expect(denied.status()).toBe(403);
  await login(page, true);
  await page.context().grantPermissions(["microphone"]);
  await page.route("**/api/v1/health", (route) =>
    route.fulfill({
      json: { data: { transcription_configured: true, transcription_provider: "deepgram" } },
    }),
  );
  await page.route(`**/api/v1/sessions/${sid}/speech-token`, (route) =>
    route.fulfill({ json: { data: { access_token: "temporary-test-only", expires_in: 30 } } }),
  );
  let saved:
    { chunk_id: string; segments: { start: number; end: number; text: string }[] } | undefined;
  let attempts = 0;
  let firstBatchId = "";
  await page.route(`**/api/v1/sessions/${sid}/transcript`, async (route) => {
    if (++attempts === 1) {
      firstBatchId = route.request().postDataJSON().chunk_id;
      await route.fulfill({ status: 503, json: { error: { message: "Uji simpan ulang" } } });
      return;
    }
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { data: { saved: true } } });
  });
  await page.routeWebSocket("wss://api.deepgram.com/v1/listen**", (ws) => {
    let sent = false;
    ws.onMessage((message) => {
      if (typeof message === "string" && message.includes("CloseStream")) {
        ws.send(
          JSON.stringify({
            type: "Results",
            start: 0,
            duration: 2,
            is_final: true,
            channel: { alternatives: [{ transcript: "Matriks terdiri dari baris dan kolom." }] },
          }),
        );
        ws.close();
      } else if (!sent) {
        sent = true;
        ws.send(
          JSON.stringify({
            type: "Results",
            start: 0,
            duration: 1,
            is_final: false,
            channel: { alternatives: [{ transcript: "Matriks terdiri" }] },
          }),
        );
      }
    });
  });
  await page.goto(`/session/${sid}?tab=transcript`);
  await page.getByRole("button", { name: "Rekam suara dosen", exact: true }).click();
  await expect(page.getByLabel("Transkrip langsung")).toContainText("Matriks terdiri");
  await expect(page.getByRole("button", { name: "Akhiri", exact: true })).toBeDisabled();
  expect(saved).toBeUndefined();
  await page.getByRole("button", { name: "Hentikan rekaman", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Rekaman kelas" }).getByRole("alert"),
  ).toContainText("Uji simpan ulang");
  await expect(page.getByRole("button", { name: "Akhiri", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Coba kirim ulang", exact: true }).click();
  await expect.poll(() => saved?.segments[0].text).toBe("Matriks terdiri dari baris dan kolom.");
  expect(saved!.segments[0].start).toBeGreaterThanOrEqual(0);
  expect(attempts).toBe(2);
  expect(saved!.chunk_id).toBe(firstBatchId);
  expect(saved!.segments[0].end - saved!.segments[0].start).toBeCloseTo(2);
  await expect(page.getByRole("button", { name: "Akhiri", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Transkrip langsung")).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`lecturer recording stays compact and fractional transcript timestamps do not overlap at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.context().grantPermissions(["microphone"]);
    await page.route("**/api/v1/health", (route) =>
      route.fulfill({ json: { data: { transcription_configured: true } } }),
    );
    await page.route(`**/api/v1/sessions/${sid}`, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.transcript = body.data.transcript.map(
        (segment: Record<string, unknown>, i: number) => ({
          ...segment,
          start_seconds: 1214.906499 + i * 27.0815,
          end_seconds: 1229.906499 + i * 27.0815,
        }),
      );
      await route.fulfill({ response, json: body });
    });
    let uploads = 0;
    await page.route(`**/api/v1/sessions/${sid}/transcribe`, (route) => {
      uploads++;
      return route.fulfill({ json: { data: { saved: true, segments: 1 } } });
    });
    await login(page, true);
    await page.goto(`/session/${sid}?tab=transcript`);
    await expect(page.locator(".session-heading .live-mic")).toHaveCount(0);
    await expect(page.locator(".panel.live-mic")).toHaveCount(0);
    const mic = page.getByRole("region", { name: "Rekaman kelas" });
    await expect(mic).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Rekam suara dosen", exact: true }),
    ).toBeEnabled();
    expect((await mic.boundingBox())!.height).toBeLessThan(100);
    const segments = page.locator(".transcript-segment");
    await expect(segments.first().locator("time")).toHaveText("20:14");
    await expect(segments.nth(1).locator("time")).toHaveText("20:41");
    for (const segment of await segments.all()) {
      const time = (await segment.locator("time").boundingBox())!;
      const text = (await segment.locator(".transcript-entry").boundingBox())!;
      expect(time.x + time.width + 8).toBeLessThanOrEqual(text.x);
    }
    await expect(segments.first().locator("p")).toHaveCSS("font-size", "16px");
    expect(
      await page.locator(".main-wrapper").evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/lecturer-transcript-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Rekam suara dosen", exact: true }).click();
    const stop = page.getByRole("button", { name: "Hentikan rekaman", exact: true });
    await expect(stop).toBeVisible();
    await expect(page.getByRole("button", { name: "Akhiri", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
    await expect(stop).toBeVisible();
    await stop.click();
    await expect.poll(() => uploads).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Akhiri", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Transkrip", exact: true }).click();
    await expect(segments.first().locator("time")).toHaveText("20:14");
  });
}
