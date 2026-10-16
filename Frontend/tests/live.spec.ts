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

test("session polling updates transcript and class status without fetching account boot again", async ({
  page,
}) => {
  await login(page, true);
  let boots = 0;
  let details = 0;
  let publish = false;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/boot") boots++;
  });
  await page.route(`**/api/v1/sessions/${sid}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    details++;
    if (publish) {
      body.data.transcript.push({
        id: randomUUID(),
        start_seconds: 1150,
        end_seconds: 1155,
        text: "Transkrip baru tanpa bootstrap akun.",
      });
      body.data.session.status = "processing";
      body.data.session.ended_at = new Date().toISOString();
    }
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/session/${sid}?tab=transcript`);
  await expect(
    page.getByLabel("Bagian kelas").getByRole("button", { name: "Transkrip", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  const initialBoots = boots;
  const initialDetails = details;
  publish = true;
  await expect(page.getByText("Transkrip baru tanpa bootstrap akun.", { exact: true })).toBeVisible(
    { timeout: 10000 },
  );
  expect(boots).toBe(initialBoots);
  expect(details).toBeGreaterThan(initialDetails);
  await page
    .getByLabel("Bagian kelas")
    .getByRole("button", { name: "Catatan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Menyiapkan catatan…", exact: true }),
  ).toBeVisible();
  expect(boots).toBe(initialBoots);
});

test("session refresh coalesces bursts and fetches changes arriving during an in-flight request", async ({
  page,
}) => {
  await login(page);
  let calls = 0;
  let active = 0;
  let maxActive = 0;
  let holdNext = false;
  let held = false;
  let publish = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/v1/sessions/${sid}`, async (route) => {
    calls++;
    const hold = holdNext;
    holdNext = false;
    active++;
    maxActive = Math.max(maxActive, active);
    const response = await route.fetch();
    const body = await response.json();
    if (hold) {
      held = true;
      await gate;
    }
    if (publish && !hold)
      body.data.transcript.push({
        id: randomUUID(),
        start_seconds: 1160,
        end_seconds: 1165,
        text: "Perubahan saat refresh tetap masuk.",
      });
    active--;
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/session/${sid}?tab=transcript`);
  await expect(
    page.getByLabel("Bagian kelas").getByRole("button", { name: "Transkrip", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  maxActive = 0;
  holdNext = true;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect.poll(() => held).toBe(true);
  publish = true;
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  release();
  await expect(
    page.getByText("Perubahan saat refresh tetap masuk.", { exact: true }),
  ).toBeVisible();
  expect(maxActive).toBe(1);
});
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
  await page.getByRole("button", { name: "Catatan", exact: true }).click();
  await expect(page.locator(".saved-preview").filter({ hasText: "Capture" })).toBeVisible();
  expect(writes).toBe(1);
  await page.reload();
  await expect(page.locator(".saved-preview").filter({ hasText: "Capture" })).toBeVisible();
  await page
    .getByLabel("Bagian kelas")
    .getByRole("button", { name: "Transkrip", exact: true })
    .click();
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
test("live question and private note persist while calendar integrations are retired", async ({
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
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("button", { name: "Hubungkan" })).toHaveCount(0);
  const response = await page.request.get("/api/v1/integrations");
  expect(response.status()).toBe(410);
});
for (const { width, teacher } of [
  { width: 1440, teacher: false },
  { width: 390, teacher: false },
  { width: 390, teacher: true },
])
  test(`profile opens from sidebar and logs out at ${width}px as ${teacher ? "lecturer" : "student"}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, teacher);
    const name = teacher ? "Nadia Putri" : "Keisha Sakura Widjaja";
    if (!teacher)
      await page.route("**/api/v1/boot", async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        body.data.profile.name = name;
        await route.fulfill({ response, json: body });
      });
    const calendarRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/integrations")) calendarRequests.push(request.url());
    });
    await page.goto("/");
    if (width < 621) await page.getByRole("button", { name: "Buka navigasi" }).click();
    else await page.locator("#main-sidebar").hover();
    await page.getByRole("link", { name: `Buka profil ${name}`, exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    const profile = page.getByRole("region", { name: "Informasi profil" });
    await expect(profile).toContainText(name);
    await expect(profile).toContainText(teacher ? "Dosen" : "Mahasiswa");
    await expect(profile).toContainText(teacher ? "dosen@test.local" : "student@test.local");
    await expect(page.getByRole("link", { name: "Pengaturan", exact: true })).toHaveCount(0);
    expect(
      await page.locator(".main-wrapper").evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(calendarRequests).toEqual([]);
    await page.screenshot({ path: `test-results/profile-${width}-${teacher}.png`, fullPage: true });
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    const protectedResponse = await page.request.get("/api/v1/boot");
    expect(protectedResponse.status()).toBe(401);
    await page.unrouteAll({ behavior: "wait" });
  });

test("retired calendar endpoints do not exchange tokens and the worker runs only study jobs", async ({
  page,
  request,
}) => {
  await login(page);
  const integration = await page.request.post("/api/v1/integrations/google/connect", {
    headers: { Origin: "http://127.0.0.1:3188" },
    data: {},
  });
  expect(integration.status()).toBe(410);
  const callback = await request.get("/api/integrations/google/callback?code=synthetic-test-only", {
    maxRedirects: 0,
  });
  expect(callback.status()).toBe(307);
  expect(callback.headers().location).toBe("http://127.0.0.1:3188/profile");
  const jobs = await request.post("/api/internal/jobs", {
    headers: { Authorization: "Bearer local-fixture-job-secret" },
  });
  expect(jobs.status()).toBe(200);
  expect((await jobs.json()).data).toEqual({ processed: false, study: { processed: false } });
});

test("live lecturer creates the first course and session; student requests cannot run the worker", async ({
  page,
  request,
}) => {
  await request.get("http://127.0.0.1:54339/reset?empty=1");
  await login(page, true);
  await expect(page.getByRole("button", { name: "Buat sesi", exact: true })).toHaveCount(0);
  await page.context().grantPermissions(["microphone"]);
  await page.route("**/api/v1/health", (route) =>
    route.fulfill({
      json: { data: { transcription_configured: true, transcription_provider: "gemini" } },
    }),
  );
  let uploads = 0;
  await page.route("**/api/v1/sessions/*/transcribe", async (route) => {
    uploads++;
    await route.fulfill({ json: { data: { saved: true, segments: 1 } } });
  });
  await page.goto("/classes");
  await expect(page.getByRole("button", { name: "Buat sesi", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Buat course", exact: true }).click();
  const courseDialog = page.getByRole("dialog", { name: "Buat course", exact: true });
  await courseDialog.getByLabel("Nama mata kuliah", { exact: true }).fill("Aljabar Baru");
  await courseDialog.getByRole("button", { name: "Simpan course", exact: true }).click();
  await expect(page).toHaveURL(/\/classes\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Aljabar Baru", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buat course", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Salin kode course COURSE2026" })).toBeVisible();
  await page.getByRole("button", { name: "Mulai kelas", exact: true }).click();
  await page.getByLabel("Topik pertemuan", { exact: true }).fill("Nilai eigen");
  await page.getByRole("button", { name: "Mulai & rekam" }).click();
  await expect(page.getByRole("heading", { name: "Nilai eigen", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hentikan rekaman", exact: true })).toBeVisible();
  await expect(page.getByText("Live", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Akhiri kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Menyiapkan catatan…" })).toBeVisible();
  expect(uploads).toBeGreaterThan(0);
  const bad = await request.post("/api/v1/courses", {
    headers: { Origin: "https://evil.test" },
    data: { name: "Injected" },
  });
  expect(bad.status()).toBe(403);
  const worker = await request.post("/api/internal/jobs");
  expect([401, 503]).toContain(worker.status());
});

for (const width of [1440, 390])
  test(`course code is generated and students join only from Course at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, true);
    await page.goto("/classes/00000000-0000-4000-8000-000000000010");
    await expect(page.getByRole("button", { name: "Salin kode course COURSE2026" })).toBeVisible();
    expect(
      await page.locator(".main-wrapper").evaluate((node) => node.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(page.getByRole("button", { name: "Buat course", exact: true })).toHaveCount(0);
    await page.goto(`/session/${sid}`);
    await expect(page.getByText("Kode: LINEAR2026", { exact: true })).toHaveCount(0);
    await login(page);
    await expect(page.getByRole("button", { name: "Gabung course", exact: true })).toHaveCount(0);
    await page.goto("/classes");
    await page.getByRole("button", { name: "Gabung course", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Gabung course", exact: true });
    await dialog.getByLabel("Kode course", { exact: true }).fill("LINEAR2026");
    await dialog.getByRole("button", { name: "Gabung", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("Kode course tidak ditemukan");
    await dialog.getByLabel("Kode course", { exact: true }).fill("course2026");
    await dialog.getByRole("button", { name: "Gabung", exact: true }).click();
    await expect(page).toHaveURL(/\/classes\/00000000-0000-4000-8000-000000000010$/);
    await expect(page.getByRole("button", { name: "Gabung course", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salin kode course COURSE2026" })).toHaveCount(0);
    await page.getByRole("link", { name: "Masuk kelas", exact: true }).click();
    await expect(page.locator(".transcript-panel")).toBeVisible();
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
  await page.locator(".graph-topic-card").filter({ hasText: "Matriks" }).click();
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
  await page.locator(".graph-topic-card").filter({ hasText: "Matriks" }).click();
  await expect(page.locator(".graph-node-detail")).toContainText(
    "Kolom dari hasil pemetaan basis.",
  );
  const detail = await (await page.request.get(`/api/v1/sessions/${sid}`)).json();
  expect(detail.data.results.graph.edges[0].relation).toBe("penerapan");
});

test("Deepgram auto-records and ending waits for final transcript and failed-save retry", async ({
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
  await page.goto(`/session/${sid}?tab=transcript&record=1`);
  await expect(page.getByRole("button", { name: "Hentikan rekaman", exact: true })).toBeVisible();
  await expect(page.getByLabel("Transkrip langsung")).toContainText("Matriks terdiri");
  await expect(page.getByRole("button", { name: "Akhiri kelas", exact: true })).toBeEnabled();
  expect(saved).toBeUndefined();
  await page.getByRole("button", { name: "Akhiri kelas", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Rekaman kelas" }).getByRole("alert"),
  ).toContainText("Uji simpan ulang");
  await expect(page.getByRole("button", { name: "Menyelesaikan…", exact: true })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Menyiapkan catatan…" })).toHaveCount(0);
  await page.getByRole("button", { name: "Coba kirim ulang", exact: true }).click();
  await expect.poll(() => saved?.segments[0].text).toBe("Matriks terdiri dari baris dan kolom.");
  expect(saved!.segments[0].start).toBeGreaterThanOrEqual(0);
  expect(attempts).toBe(2);
  expect(saved!.chunk_id).toBe(firstBatchId);
  expect(saved!.segments[0].end - saved!.segments[0].start).toBeCloseTo(2);
  await expect(page.getByRole("heading", { name: "Menyiapkan catatan…" })).toBeVisible();
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
    await expect(page.getByRole("button", { name: "Rekam", exact: true })).toBeEnabled();
    expect((await mic.boundingBox())!.height).toBeLessThan(100);
    const segments = page.locator(".transcript-segment");
    await expect(segments.first().locator("time")).toHaveText("20:00");
    await expect(segments.nth(1).locator("time")).toHaveText("20:30");
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
    await page.getByRole("button", { name: "Rekam", exact: true }).click();
    const stop = page.getByRole("button", { name: "Hentikan rekaman", exact: true });
    await expect(stop).toBeVisible();
    await expect(page.getByRole("button", { name: "Akhiri kelas", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
    await expect(stop).toBeVisible();
    await stop.click();
    await expect.poll(() => uploads).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Akhiri kelas", exact: true })).toBeEnabled();
    await page
      .getByLabel("Bagian kelas")
      .getByRole("button", { name: "Transkrip", exact: true })
      .click();
    await expect(segments.first().locator("time")).toHaveText("20:00");
    await page.unrouteAll({ behavior: "wait" });
  });
}
