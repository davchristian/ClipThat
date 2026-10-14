import { expect, test } from "@playwright/test";

test("sidebar wheel stays separate and compact role options leave the name visible", async ({
  page,
}) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 540 });
    await page.goto("/session/linear-05");
    const main = page.locator(".main-wrapper");
    await page.mouse.move(width - 24, 80);
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 260);
        return main.evaluate((element) => element.scrollTop);
      })
      .toBeGreaterThan(0);
    await page.waitForTimeout(150);
    const scrollTop = await main.evaluate((element) => element.scrollTop);
    if (width === 390) await page.getByRole("button", { name: "Buka navigasi" }).click();
    const sidebar = page.locator(".sidebar");
    await sidebar.hover({ position: { x: 20, y: 70 } });
    await page.mouse.wheel(0, 600);
    // Wheel scrolling is applied asynchronously by the browser compositor.
    await page.waitForTimeout(150);
    expect(await main.evaluate((element) => element.scrollTop)).toBe(scrollTop);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const trigger = page.getByRole("button", { name: "Pilih peran demo" });
    await expect(trigger).toHaveText("Mahasiswa");
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox!.width).toBeLessThan(110);
    expect(triggerBox!.height).toBeLessThanOrEqual(28);
    await trigger.click();
    const options = page.getByRole("group", { name: "Pilihan peran demo" });
    const optionsBox = await options.boundingBox();
    const nameBox = await sidebar.getByText("Davin Farel", { exact: true }).boundingBox();
    expect(optionsBox!.y + optionsBox!.height).toBeLessThan(nameBox!.y);
    if (width === 1440) {
      await sidebar.screenshot({ path: "test-results/sidebar-role-menu.png" });
    }
    await page.keyboard.press("Escape");
    await expect(options).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await sidebar.getByRole("link", { name: "ClipThat beranda" }).click();
    await expect(options).toHaveCount(0);
    await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const trigger = page.getByRole("button", { name: "Pilih peran demo" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("Dosen");
  await expect(page.locator(".profile strong")).toHaveText("Nadia Putri");
  await page.reload();
  await expect(trigger).toHaveText("Dosen");
  await trigger.click();
  await page.getByRole("button", { name: "Mahasiswa", exact: true }).click();
  await expect(page.locator(".profile strong")).toHaveText("Davin Farel");
});

test("simple navigation, capture confirmation, bookmarks and personal review", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(3);
  expect(
    await page
      .locator("main")
      .evaluate((main) => (main as HTMLElement).innerText.trim().split(/\s+/).length),
  ).toBeLessThanOrEqual(65);
  await page.getByRole("button", { name: "Gabung kelas", exact: true }).click();
  await page.getByLabel("Kode kelas").fill("WRONG");
  await page.getByRole("dialog").getByRole("button", { name: "Gabung kelas" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Kode tidak ditemukan");
  await page.getByLabel("Kode kelas").fill("alg05");
  await page.getByRole("dialog").getByRole("button", { name: "Gabung kelas" }).click();
  await expect(page).toHaveURL(/session\/linear-05/);
  await expect(page.locator(".tabs button")).toHaveCount(4);
  await page.getByRole("button", { name: "Simpan bagian 17:45" }).click();
  await expect(page.getByRole("button", { name: "Hapus penanda 17:45" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Preview capture" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Simpan capture", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Preview capture" })).toHaveCount(0);
  await page.getByRole("button", { name: "Tersimpan (2)" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Capture · 17:00/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("17:00 – 18:30");
  await page
    .getByRole("dialog")
    .locator("summary")
    .filter({ hasText: "Ajukan pertanyaan" })
    .click();
  await page.getByLabel("Draf pertanyaan capture").fill("Apakah rotasi juga transformasi linear?");
  await page.getByRole("button", { name: "Kirim anonim", exact: true }).click();
  await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
  await expect(
    page.getByText("Apakah rotasi juga transformasi linear?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Dukung pertanyaan: Apakah rotasi juga transformasi linear?" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Batalkan dukungan: Apakah rotasi juga transformasi linear?",
    }),
  ).toContainText("1");
  await page
    .getByRole("button", { name: "Batalkan dukungan: Apakah rotasi juga transformasi linear?" })
    .click();
  await page.reload();
  await expect(
    page.getByText("Apakah rotasi juga transformasi linear?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Catatan", exact: true }).click();
  await page.locator(".personal-note summary").click();
  await page.getByLabel("Catatan pribadimu").fill("Ulangi representasi matriks besok.");
  await page.reload();
  await page.locator(".personal-note summary").click();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveValue(
    "Ulangi representasi matriks besok.",
  );
  await page.locator("summary").filter({ hasText: "Bagian ditandai" }).click();
  await page.getByRole("button", { name: /Representasi matriks/ }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Buka kelas", exact: true }).click();
  await expect(page.getByRole("button", { name: "Capture 90 detik" })).toBeVisible();
  await page.goto("/review");
  await page.getByRole("button", { name: "Buka Capture · 17:00", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sudah paham", exact: true }).click();
  await expect(page.locator(".saved-row").filter({ hasText: "Capture · 17:00" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("capture preview stays private until saved and can be discarded, closed or abandoned", async ({
  page,
}) => {
  await page.goto("/session/linear-05");
  const trigger = page.getByRole("button", { name: "Capture 90 detik" });
  const preview = page.getByRole("complementary", { name: "Preview capture" });
  const saved = page.getByRole("button", { name: "Tersimpan (0)" });
  await expect(trigger).toBeVisible();
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("clipthat-frontend-v1") || "{}"));
  const questionCount = (await stored()).questions.length;
  const existingSaved = (await stored()).saved;
  await trigger.click();
  await expect(preview).toContainText("Belum disimpan");
  expect((await preview.boundingBox())!.width).toBeGreaterThanOrEqual(360);
  await expect(preview).toContainText("17:00–18:30");
  await expect(saved).toBeVisible();
  expect((await stored()).saved).toEqual(existingSaved);
  expect((await stored()).questions).toHaveLength(questionCount);
  await expect(page.locator(".transcript-segment.in-capture")).toHaveCount(3);
  const transcript = page.locator(".transcript-content");
  await transcript.hover();
  await page.mouse.wheel(0, 260);
  await expect.poll(() => transcript.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(preview).toBeVisible();
  await preview.locator("summary").filter({ hasText: "Transkrip sumber" }).click();
  await expect(preview.locator(".capture-source p")).toContainText("T(u + v)");
  await expect(preview.getByRole("button", { name: "Simpan capture" })).toBeInViewport({
    ratio: 1,
  });
  await page.screenshot({ path: "docs/screenshots/capture-preview.png", animations: "disabled" });
  await preview.getByRole("button", { name: "Buang capture", exact: true }).click();
  await expect(preview).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(saved).toBeVisible();
  await expect(page.locator(".transcript-segment.in-capture")).toHaveCount(0);

  await trigger.click();
  await preview.getByRole("button", { name: "Buang dan tutup preview" }).click();
  await expect(saved).toBeVisible();
  await trigger.click();
  await page.reload();
  await expect(preview).toHaveCount(0);
  await expect(saved).toBeVisible();
  await trigger.click();
  await page.getByRole("navigation").getByRole("link", { name: "Tersimpan", exact: true }).click();
  await expect(page.locator(".saved-row")).toHaveCount(existingSaved.length);
  await page.goto("/session/linear-05");
  await expect(preview).toHaveCount(0);

  await trigger.click();
  await preview.getByRole("button", { name: "Edit dan kirim" }).click();
  await preview
    .getByLabel("Draf pertanyaan capture")
    .fill("Mengapa basis menentukan kolom matriks?");
  await page.getByRole("button", { name: "Catatan", exact: true }).click();
  await expect(preview.getByLabel("Draf pertanyaan capture")).toHaveValue(
    "Mengapa basis menentukan kolom matriks?",
  );
  await page
    .getByLabel("Bagian kelas")
    .getByRole("button", { name: "Transkrip", exact: true })
    .click();
  await preview.getByRole("button", { name: "Kirim anonim" }).click();
  await expect(preview.getByRole("status")).toHaveText("Pertanyaan terkirim");
  await expect(saved).toBeVisible();
  await expect.poll(async () => (await stored()).questions.length).toBe(questionCount + 1);
  expect((await stored()).saved).toEqual(existingSaved);
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  await expect.poll(async () => (await stored()).saved.length).toBe(existingSaved.length + 1);
  expect((await stored()).saved.at(-1).draft).toBe("Mengapa basis menentukan kolom matriks?");
  await page.reload();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
});

test("small-screen capture preview confirms saving and closing never saves a draft", async ({
  page,
}) => {
  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: 650 });
    await page.goto("/session/linear-05");
    const trigger = page.getByRole("button", { name: "Capture 90 detik" });
    const preview = page.getByRole("dialog", { name: "Preview capture" });
    await trigger.click();
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("button", { name: "Simpan capture" })).toBeInViewport({
      ratio: 1,
    });
    await expect(
      preview.getByRole("button", { name: "Buang capture", exact: true }),
    ).toBeInViewport({
      ratio: 1,
    });
    await preview.locator("summary").filter({ hasText: "Transkrip sumber" }).click();
    await expect(preview.getByRole("button", { name: "Simpan capture" })).toBeInViewport({
      ratio: 1,
    });
    if (width === 390) {
      await page.screenshot({
        path: "docs/screenshots/capture-preview-mobile.png",
        animations: "disabled",
      });
    }
    await preview.getByRole("button", { name: "Buang capture", exact: true }).click();
    await expect(preview).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tersimpan (0)" })).toBeVisible();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(preview).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tersimpan (0)" })).toBeVisible();
    await trigger.click();
    await preview.getByRole("button", { name: "Tutup dialog" }).click();
    await expect(preview).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tersimpan (0)" })).toBeVisible();
  }
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Simpan capture" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Tersimpan (1)" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.querySelector(".main-wrapper")!.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});

test("transcript and capture stay equal in height and aligned through page and panel scrolling", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 1000 },
    { width: 1920, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/session/linear-05");
    const originalHeight = await page
      .locator(".transcript-panel")
      .evaluate((element) => element.getBoundingClientRect().height);
    await page.getByRole("button", { name: "Capture 90 detik" }).click();
    const preview = page.getByRole("complementary", { name: "Preview capture" });
    const transcript = page.locator(".transcript-panel");
    const main = page.locator(".main-wrapper");
    const aligned = async () => {
      const left = (await transcript.boundingBox())!;
      const right = (await preview.boundingBox())!;
      expect(Math.abs(left.y - right.y), `top at ${viewport.width}px`).toBeLessThan(1);
      expect(Math.abs(left.height - right.height), `height at ${viewport.width}px`).toBeLessThan(1);
    };
    await aligned();
    expect((await transcript.boundingBox())!.height).toBeGreaterThanOrEqual(originalHeight);
    await preview.locator("summary").filter({ hasText: "Transkrip sumber" }).click();
    await preview.getByRole("button", { name: "Edit dan kirim" }).click();
    await preview
      .getByLabel("Draf pertanyaan capture")
      .fill("Bagaimana cara menentukan matriksnya? ".repeat(20));
    await aligned();
    // Editing focuses the textarea and may scroll an ancestor into view.
    await main.evaluate((element) => element.scrollTo({ top: 0, behavior: "instant" }));
    const initialY = (await transcript.boundingBox())!.y;
    await page.mouse.move(viewport.width - 12, 100);
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 160);
        return main.evaluate((element) => element.scrollTop);
      })
      .toBeGreaterThan(0);
    await expect.poll(async () => (await transcript.boundingBox())!.y).toBeLessThan(initialY);
    await aligned();
    const mainScroll = await main.evaluate((element) => {
      element.scrollTop = Math.floor(element.scrollTop / 2);
      return element.scrollTop;
    });
    const transcriptBody = page.locator(".transcript-content");
    const transcriptBounds = (await transcriptBody.boundingBox())!;
    await page.mouse.move(transcriptBounds.x + 40, Math.max(150, transcriptBounds.y + 40));
    await page.mouse.wheel(0, 2000);
    await expect
      .poll(() => transcriptBody.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await page.mouse.wheel(0, 1000);
    const previewBody = preview.locator(".capture-preview-body");
    const previewBounds = (await previewBody.boundingBox())!;
    await page.mouse.move(previewBounds.x + 40, Math.max(150, previewBounds.y + 40));
    await page.mouse.wheel(0, 2000);
    await expect
      .poll(() => previewBody.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await page.mouse.wheel(0, 1000);
    expect(await main.evaluate((element) => element.scrollTop)).toBe(mainScroll);
    await aligned();
    await main.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight, behavior: "instant" }),
    );
    await aligned();
    await expect(preview.getByRole("button", { name: "Simpan capture" })).toBeInViewport({
      ratio: 1,
    });
    if (viewport.width === 1440) {
      await page.screenshot({
        path: "docs/screenshots/capture-preview-aligned.png",
        animations: "disabled",
      });
    }
    await preview.getByRole("button", { name: "Buang capture" }).click();
    await expect(page.locator(".transcript-panel")).toBeVisible();
  }
});

test("agenda supports confirmation, quick creation, edit, completion, export and delete", async ({
  page,
}) => {
  await page.goto("/agenda");
  await expect(page.locator(".agenda-item")).toHaveCount(3);
  await page.getByRole("button", { name: "Tinjau", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Pengumuman kelas");
  await page.getByRole("dialog").getByRole("button", { name: "Konfirmasi agenda" }).click();
  await expect(page.locator(".agenda-item")).toHaveCount(4);
  await page.getByRole("button", { name: "Tambah", exact: true }).click();
  await expect(page.getByLabel("Mata kuliah", { exact: true })).not.toBeVisible();
  await page.getByLabel("Judul agenda").fill("Belajar bareng Dinda");
  await page.getByLabel("Tanggal", { exact: true }).fill("2026-10-06");
  await page.getByRole("button", { name: "Simpan agenda" }).click();
  await page.getByRole("button", { name: "Edit Belajar bareng Dinda" }).click();
  await page.getByLabel("Judul agenda").fill("Belajar bareng Dinda & Rani");
  await page.getByRole("button", { name: "Simpan agenda" }).click();
  const item = page.locator(".agenda-item").filter({ hasText: "Belajar bareng Dinda & Rani" });
  await item.getByRole("button", { name: /^Selesaikan:/ }).click();
  await expect(item).toHaveClass(/done/);
  await page.getByLabel("Opsi agenda").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh kalender (.ics)", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("clipthat-agenda.ics");
  await item.getByRole("button", { name: /^Edit/ }).click();
  await page.getByRole("button", { name: "Hapus agenda", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hapus agenda", exact: true }).click();
  await expect(item).toHaveCount(0);
});

test("lecturer answers, updates map, ends class, archives, restores and creates a session", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(1);
  await page.getByRole("link", { name: "Buka kelas", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Tersimpan/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
  await page.getByRole("button", { name: "Jawab", exact: true }).first().click();
  await page
    .getByLabel("Jawabanmu")
    .fill("Ya, representasinya bergantung pada basis yang dipakai.");
  await page.getByRole("button", { name: "Simpan jawaban" }).click();
  await expect(
    page
      .locator(".answer")
      .filter({ hasText: "Ya, representasinya bergantung pada basis yang dipakai." }),
  ).toBeVisible();
  await page
    .getByLabel("Bagian kelas")
    .getByRole("button", { name: "Materi", exact: true })
    .click();
  await page.getByRole("button", { name: "Koreksi hubungan" }).click();
  await page.getByLabel("Jenis hubungan").selectOption("penerapan");
  await page.getByRole("button", { name: "Simpan hubungan" }).click();
  await expect(page.locator(".concept-edge").first()).toHaveText("penerapan");
  await page.getByRole("button", { name: "Akhiri", exact: true }).click();
  await page.getByRole("button", { name: "Selesaikan kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ringkasan", exact: true })).toBeVisible();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveCount(0);
  await page.goto("/classes/aljabar");
  await page.getByLabel("Opsi Transformasi linear").click();
  await page.getByRole("button", { name: "Arsipkan Transformasi linear" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arsipkan", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Buka Transformasi linear", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Arsip (1)" }).click();
  await page.getByRole("button", { name: "Pulihkan" }).click();
  await expect(
    page.getByRole("link", { name: "Buka Transformasi linear", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Buat sesi", exact: true }).click();
  await page.getByLabel("Topik pertemuan").fill("Nilai eigen");
  await page.getByRole("button", { name: "Buat sesi kelas" }).click();
  await expect(page.getByRole("heading", { name: "Nilai eigen", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mulai kelas", exact: true }).click();
  await expect(page.getByText("Live", { exact: true })).toBeVisible();
});

test("main views keep consistent typography and controls without browser errors or horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
    for (const path of [
      "/",
      "/classes",
      "/classes/aljabar",
      "/session/linear-05",
      "/session/basis-04",
      "/review",
      "/agenda",
      "/settings",
      "/login",
      "/register",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator(".processing")).toHaveCount(0);
      const headingStyle = await page
        .locator("h1")
        .first()
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
        });
      expect(headingStyle.size, `${path} heading at ${width}px`).toBe(
        width <= 620 ? "24px" : "28px",
      );
      expect(headingStyle.weight).toBe("600");
      expect(headingStyle.family).toContain("DM Sans Variable");
      const buttons = await page.locator(".button").evaluateAll((elements) =>
        elements
          .filter((element) => element.getClientRects().length)
          .map((element) => {
            const style = getComputedStyle(element);
            return {
              small: element.classList.contains("small"),
              height: element.getBoundingClientRect().height,
              font: style.fontSize,
            };
          }),
      );
      for (const button of buttons) {
        expect(button.height, `${path} button at ${width}px`).toBe(button.small ? 36 : 44);
        expect(button.font).toBe(button.small ? "13px" : "14px");
      }
      expect(
        await page.evaluate(() => {
          const content = document.querySelector(".main-wrapper, .auth-page")!;
          return (
            document.documentElement.scrollWidth <= window.innerWidth + 1 &&
            content.scrollWidth <= content.clientWidth + 1
          );
        }),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("login and registration validate input and open only the frontend demo", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Selamat datang kembali." })).toBeVisible();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page
      .getByLabel("Email", { exact: true })
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBe(true);
  await page.getByLabel("Email", { exact: true }).fill("email-tidak-valid");
  expect(
    await page
      .getByLabel("Email", { exact: true })
      .evaluate((input: HTMLInputElement) => input.validity.typeMismatch),
  ).toBe(true);
  await page.getByLabel("Email", { exact: true }).fill("demo@example.com");
  await page.getByLabel("Kata sandi", { exact: true }).fill("contoh123");
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Tampilkan kata sandi" }).click();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sembunyikan kata sandi" }).click();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Masuk", exact: true }).click();
  await page.getByRole("link", { name: "Daftar", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.getByLabel("Nama lengkap", { exact: true }).fill("  ");
  await page.getByLabel("Email", { exact: true }).fill("dosen-demo@example.com");
  await page.getByLabel("Kata sandi", { exact: true }).fill("demo-password-123");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page.locator(".auth-form").getByRole("alert")).toContainText("minimal 2 karakter");
  await page.getByLabel("Nama lengkap", { exact: true }).fill("Dosen Contoh");
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Dosen", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Pilih peran demo" })).toHaveText("Dosen");
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(storage).not.toContain("demo-password-123");
  expect(storage).not.toContain("demo@example.com");
  expect(storage).not.toContain("dosen-demo@example.com");
  await page.goto("/register");
  await page.getByRole("link", { name: "Masuk", exact: true }).click();
  await page.getByRole("link", { name: "Coba tanpa akun" }).click();
  await expect(page).toHaveURL("/");
});

test("four visible classroom tabs and the materials map work on phones, tablets and desktop for both roles", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const role of ["Mahasiswa", "Dosen"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/session/linear-05");
    if (role === "Dosen") {
      await page.getByRole("button", { name: "Pilih peran demo" }).click();
      await page.getByRole("button", { name: "Dosen", exact: true }).click();
    }
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/session/linear-05");
      const tabs = page.getByLabel("Bagian kelas");
      await expect(tabs.getByRole("button")).toHaveText([
        "Transkrip",
        "Catatan",
        "Pertanyaan",
        "Materi",
      ]);
      const tabBoxes = await tabs
        .getByRole("button")
        .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().y));
      expect(new Set(tabBoxes).size).toBe(1);
      await expect(page.getByLabel("Lainnya di kelas")).toHaveCount(0);
      for (const name of ["Transkrip", "Catatan", "Pertanyaan", "Materi"]) {
        await tabs.getByRole("button", { name, exact: true }).click();
        await expect(tabs.getByRole("button", { name, exact: true })).toHaveAttribute(
          "aria-current",
          "page",
        );
        const main = page.locator(".main-wrapper");
        expect(
          await main.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
          `${role} ${name} at ${viewport.width}x${viewport.height}`,
        ).toBe(true);
      }
      await expect(page.getByRole("heading", { name: "Berkas kelas", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Peta konsep", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Basis dan dimensi", exact: true }).click();
      await expect(page.locator(".concept-detail")).toContainText(
        "Dasar dari pertemuan sebelumnya.",
      );
      if (viewport.width <= 844) await expect(page.locator(".concept-detail h3")).toBeInViewport();
      await page.getByRole("button", { name: "Materi terkait", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Berkas kelas", exact: true }),
      ).toBeInViewport();
      await page.getByRole("button", { name: "Buka pembahasan", exact: true }).click();
      await expect(page.locator(".transcript-toolbar")).toBeInViewport();
    }
  }
  await page.goto("/session/linear-05?tab=graph");
  await expect(
    page.getByLabel("Bagian kelas").getByRole("button", { name: "Materi", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Peta konsep", exact: true })).toBeInViewport();
  expect(errors).toEqual([]);
});

test("capture actions stay reachable on narrow phones and landscape screens", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/session/linear-05");
    await page.getByRole("button", { name: "Capture 90 detik" }).click();
    const preview = page.getByRole("dialog", { name: "Preview capture" });
    await expect(preview).toBeVisible();
    await preview.locator("summary").filter({ hasText: "Transkrip sumber" }).click();
    await preview.getByRole("button", { name: "Edit dan kirim" }).click();
    await preview
      .getByLabel("Draf pertanyaan capture")
      .fill("Bagaimana cara menentukan basis baru?");
    await expect(preview.getByRole("button", { name: "Simpan capture" })).toBeInViewport({
      ratio: 1,
    });
    const discard = preview.getByRole("button", { name: "Buang capture", exact: true });
    await expect(discard).toBeInViewport({ ratio: 1 });
    expect((await discard.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    expect(
      await preview.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await discard.click();
    await expect(page.getByRole("button", { name: "Tersimpan (0)" })).toBeVisible();
  }
});

test("photo upload validates timestamp and persists in the saved collection", async ({ page }) => {
  await page.goto("/session/linear-05");
  await page.getByRole("button", { name: "Tambahkan foto" }).click();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Foto papan atau slide")
    .setInputFiles({ name: "papan.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Waktu dalam transkrip").fill("99:00");
  await page.getByRole("button", { name: "Simpan foto" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("00:00–18:30");
  await page.getByLabel("Waktu dalam transkrip").fill("17:20");
  await page.getByRole("button", { name: "Simpan foto" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Tersimpan (1)" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Foto papan · 17:20/ })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("img", { name: "Foto papan · 17:20", exact: true }),
  ).toBeVisible();
});

test("calendar preferences remain explicit about connection state and reset works", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.locator(".settings-calendars summary").click();
  await page.getByRole("button", { name: "Atur tujuan" }).first().click();
  await page.getByLabel("Nama kalender tujuan").fill("Kuliah semester 3");
  await page.getByRole("button", { name: "Simpan tujuan" }).click();
  await expect(page.getByText("Tujuan: Kuliah semester 3 · belum terhubung")).toBeVisible();
  await page.reload();
  await page.locator(".settings-calendars summary").click();
  await expect(page.getByText("Tujuan: Kuliah semester 3 · belum terhubung")).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset sekarang", exact: true }).click();
  await expect(page.getByText("Belum terhubung", { exact: true })).toHaveCount(3);
});

test("save current desktop and mobile design previews", async ({ page }) => {
  for (const [path, name] of [
    ["/", "dashboard"],
    ["/session/linear-05", "classroom"],
    ["/agenda", "agenda"],
    ["/session/linear-05?tab=materials", "materials"],
    ["/login", "login"],
    ["/register", "register"],
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  for (const [path, name] of [
    ["/login", "login-mobile"],
    ["/register", "register-mobile"],
    ["/session/linear-05?tab=materials", "materials-mobile"],
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
});
