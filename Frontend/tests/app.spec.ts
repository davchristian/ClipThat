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

test("simple navigation, one-tap capture, bookmarks and personal review", async ({ page }) => {
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
  await expect(page.locator(".tabs button")).toHaveCount(3);
  await page.getByRole("button", { name: "Simpan bagian 17:45" }).click();
  await expect(page.getByRole("button", { name: "Hapus penanda 17:45" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
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
  await page.getByLabel("Lainnya di kelas").click();
  await page.getByRole("button", { name: "Peta konsep", exact: true }).click();
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

test("main views work without browser errors or horizontal overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const path of [
      "/",
      "/classes",
      "/classes/aljabar",
      "/session/linear-05",
      "/session/basis-04",
      "/review",
      "/agenda",
      "/settings",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator(".processing")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kelas", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
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
});
