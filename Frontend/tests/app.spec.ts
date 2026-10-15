import { expect, test, type Page } from "@playwright/test";

async function openSavedItem(page: Page, sessionId: string, title: string) {
  const id = await page.evaluate(
    ({ sessionId, title }) => {
      const data = JSON.parse(localStorage.getItem("clipthat-frontend-v1")!);
      return data.saved.find(
        (item: { id: string; sessionId: string; title: string }) =>
          item.sessionId === sessionId && item.title.includes(title),
      )?.id;
    },
    { sessionId, title },
  );
  expect(id).toBeTruthy();
  await page.goto(`/session/${sessionId}?tab=transcript&saved=${encodeURIComponent(id)}`);
}

test("course shows schedule, overall summary, nearest agenda and past class sources", async ({
  page,
}) => {
  await page.goto("/classes");
  const main = page.locator("#main-content");
  await expect(main.locator(".course-tile")).toHaveCount(4);
  const course = main.locator(".course-tile").filter({ hasText: "Aljabar Linear" });
  await expect(course).toContainText("IF2123");
  await expect(course).toContainText("Dr. Nadia Putri");
  await expect(course).toContainText("Senin & Kamis · 09.00–10.30");
  await course.click();
  await expect(page).toHaveURL(/classes\/aljabar$/);
  await expect(main.getByLabel("Informasi mata kuliah")).toHaveCount(0);
  await main
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Course", exact: true })
    .click();
  await expect(page).toHaveURL(/classes$/);
  await course.click();
  await expect(main.locator(".course-agenda-panel")).toContainText(
    "Kuis basis dan transformasi linear",
  );
  const live = main.locator(".course-session-card").filter({ hasText: "Transformasi linear" });
  await expect(live.getByRole("link")).toHaveCount(1);
  await expect(live.getByRole("link", { name: "Masuk kelas" })).toBeVisible();
  await main.locator(".course-summary-panel").getByRole("link", { name: "Lihat materi" }).click();
  await expect(page).toHaveURL(/classes\/aljabar\/materials/);
  await expect(main).toContainText("Basis adalah himpunan vektor");
  await expect(main.getByLabel("Peta konsep interaktif")).toBeVisible();
  await expect(main.getByLabel("Pilih subbab").locator("option")).toContainText([
    "Pilih subbab",
    "Bebas linear",
    "Basis sebuah ruang",
    "Dimensi",
  ]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(main.getByRole("heading", { name: "Materi Aljabar Linear" })).toBeVisible();
  await main.getByRole("link", { name: "Aljabar Linear", exact: true }).click();
  const previous = main.locator(".course-session-card").filter({ hasText: "Basis dan dimensi" });
  await expect(previous).toContainText("1 bagian ditandai");
  await expect(previous).toContainText("1 pertanyaan kelas");
  await expect(previous.getByRole("link", { name: "Buka rangkuman kelas" })).toBeVisible();
  await expect(previous).not.toContainText("Sebuah himpunan bebas linear jika");
  await previous.getByRole("link", { name: "Transkrip mentah" }).click();
  await expect(page).toHaveURL(/session\/basis-04\?tab=transcript/);
  await expect(page.locator(".transcript-content")).toContainText(
    "Kita mulai dari dua vektor ini dulu",
  );
  await expect(page.locator(".transcript-content")).not.toContainText(
    "Sebuah himpunan bebas linear jika",
  );
  await main.getByRole("link", { name: "Aljabar Linear", exact: true }).click();
  await expect(page).toHaveURL(/classes\/aljabar$/);
  await main
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Course", exact: true })
    .click();
  await expect(page).toHaveURL(/classes$/);
  await expect(main.locator(".course-tile")).toHaveCount(4);
  await page.goto("/classes/aljabar");
  await page.reload();
  await main
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Course", exact: true })
    .click();
  await expect(page).toHaveURL(/classes$/);
  await page.goto("/classes/algoritma");
  await expect(main.locator(".course-summary-panel")).toContainText("Belum ada rangkuman materi.");
});

test("completed classes retain transcript history and allow private review and lecturer answers", async ({
  page,
}) => {
  await page.goto("/session/basis-04?tab=transcript");
  await expect(page.locator(".transcript-segment.marked")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Capture 90 detik" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tambahkan foto" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^(Simpan bagian|Hapus penanda)/ })).toHaveCount(0);
  await expect(page.locator(".transcript-toolbar button")).toHaveCount(0);
  await openSavedItem(page, "basis-04", "Menentukan basis sebuah ruang");
  await expect(page.getByRole("dialog")).toContainText("Basis adalah himpunan vektor");
  await page.getByRole("button", { name: "Sudah paham", exact: true }).click();
  await page.getByRole("button", { name: "Catatan", exact: true }).click();
  await page.getByText("Catatan pribadi", { exact: true }).click();
  await page.getByLabel("Catatan pribadimu").fill("Ulangi basis sebelum matriks.");
  await page.getByRole("button", { name: "Simpan catatan", exact: true }).click();
  await page.reload();
  await page.getByText("Catatan pribadi", { exact: true }).click();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveValue("Ulangi basis sebelum matriks.");
  await page.locator("#main-sidebar").hover();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
  await page
    .locator(".question-card")
    .first()
    .getByRole("button", { name: "Jawab", exact: true })
    .click();
  await page
    .getByLabel("Jawaban dosen", { exact: true })
    .fill("Periksa bebas linear dan apakah vektor membangun ruang.");
  await page.getByRole("button", { name: "Simpan jawaban" }).click();
  await page.reload();
  await expect(page.locator(".answer")).toContainText("Periksa bebas linear");
  await page.getByRole("button", { name: "Materi", exact: true }).click();
  await page.getByRole("button", { name: "Peta konsep", exact: true }).click();
  await expect(page.getByRole("button", { name: "Koreksi hubungan" })).toBeVisible();
});

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
  await page.locator("#main-sidebar").hover();
  await expect(trigger).toHaveText("Dosen");
  await trigger.click();
  await page.getByRole("button", { name: "Mahasiswa", exact: true }).click();
  await expect(page.locator(".profile strong")).toHaveText("Davin Farel");
});

test("sidebar expands on hover and folds on leave without shifting the page", async ({ page }) => {
  await page.mouse.move(900, 200);
  await page.goto("/classes");
  const sidebar = page.locator("#main-sidebar");
  const navigation = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(76);
  const logo = sidebar.locator(".brand-symbol");
  const logoPosition = await logo.boundingBox();
  await expect(page.locator(".main-wrapper")).toHaveCSS("margin-left", "76px");
  await expect(sidebar.locator(".nav-item > span").first()).toBeHidden();
  await expect(page.getByRole("button", { name: /Lipat sidebar|Buka sidebar/ })).toHaveCount(0);
  await page.screenshot({
    path: "docs/screenshots/sidebar-collapsed.png",
    animations: "disabled",
    caret: "initial",
  });
  await sidebar.hover();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(216);
  expect(await logo.boundingBox()).toEqual(logoPosition);
  await expect(sidebar.locator(".nav-item > span").first()).toBeVisible();
  await expect(sidebar.getByText("Davin Farel", { exact: true })).toBeVisible();
  await expect(page.locator(".main-wrapper")).toHaveCSS("margin-left", "76px");
  await navigation.getByRole("link", { name: "Agenda", exact: true }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await page.mouse.move(900, 200);
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(76);
  expect(await logo.boundingBox()).toEqual(logoPosition);
  await page.reload();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(76);
  await page.locator("#main-content").focus();
  await page.keyboard.press("Shift+Tab");
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(216);
  expect(await logo.boundingBox()).toEqual(logoPosition);
  await page.locator("#main-content").focus();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(76);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(216);
  await expect(sidebar.locator(".nav-item > span").first()).toBeVisible();
  await navigation.getByRole("link", { name: "Course", exact: true }).click();
  await expect(page).toHaveURL(/\/classes$/);
  await expect(page.locator(".sidebar-scrim")).toHaveCount(0);
  await expect(page.locator(".main-wrapper")).toHaveCSS("margin-left", "0px");
});

test("capture previews and discards without saving, then saves only after confirmation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const savedCount = () =>
    page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem("clipthat-frontend-v1")!);
      return data.saved.filter((item: { sessionId: string }) => item.sessionId === "linear-05")
        .length;
    });
  await page.goto("/session/linear-05");
  await expect(page.locator(".tabs button")).toHaveCount(4);
  await page.getByRole("button", { name: "Simpan bagian 17:45", exact: true }).click();
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  const preview = page.getByRole("complementary", { name: "Preview capture" });
  await expect(preview).toBeVisible();
  await expect.poll(savedCount).toBe(1);
  const left = (await page.locator(".transcript-panel").boundingBox())!;
  const right = (await preview.boundingBox())!;
  expect(left.height).toBeGreaterThanOrEqual(740);
  expect(Math.abs(left.height - right.height)).toBeLessThan(1);
  expect(Math.abs(left.y - right.y)).toBeLessThan(1);
  await page.screenshot({
    path: "docs/screenshots/capture-preview.png",
    animations: "disabled",
    caret: "initial",
  });
  await preview.getByRole("button", { name: "Buang preview capture" }).click();
  await expect(preview).toHaveCount(0);
  await page.reload();
  await expect.poll(savedCount).toBe(1);
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await page.getByLabel("Edit saran pertanyaan").fill("Apakah rotasi juga transformasi linear?");
  await preview.getByRole("button", { name: "Tinjau pertanyaan" }).click();
  await expect(page.getByLabel("Pertanyaan anonim")).toHaveValue(
    "Apakah rotasi juga transformasi linear?",
  );
  await page.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(page.locator(".question-card")).toContainText([
    "Apakah rotasi juga transformasi linear?",
  ]);
  await page.getByRole("button", { name: "Transkrip", exact: true }).click();
  await preview.getByRole("button", { name: "Simpan capture" }).click();
  await expect(preview).toHaveCount(0);
  await expect.poll(savedCount).toBe(2);
  await page.reload();
  await expect.poll(savedCount).toBe(2);
  expect(errors).toEqual([]);
});

test("compact questions support anonymous posting, voting and reload on mobile", async ({
  page,
}) => {
  await page.goto("/session/linear-05?tab=questions");
  const composer = page.getByLabel("Pertanyaan anonim");
  const send = page.getByRole("button", { name: "Kirim", exact: true });
  await expect(send).toBeDisabled();
  await composer.fill("   ");
  await expect(send).toBeDisabled();
  await composer.fill("");
  await page.screenshot({
    path: "docs/screenshots/questions.png",
    animations: "disabled",
    caret: "initial",
  });
  await composer.fill("  Bagaimana cara memilih basis yang tepat?  ");
  await send.click();
  const question = page
    .locator(".question-card")
    .filter({ hasText: "Bagaimana cara memilih basis yang tepat?" });
  await expect(question).toBeVisible();
  await expect(composer).toHaveValue("");
  await expect(send).toBeDisabled();
  await question.getByRole("button", { name: /^Dukung pertanyaan:/ }).click();
  await expect(question.getByRole("button", { name: /^Batalkan dukungan:/ })).toContainText("1");
  await question.getByRole("button", { name: /^Batalkan dukungan:/ }).click();
  await expect(question.getByRole("button", { name: /^Dukung pertanyaan:/ })).toContainText("0");
  await page.reload();
  await expect(question).toBeVisible();
  await page.setViewportSize({ width: 390, height: 1100 });
  await expect(composer).toBeVisible();
  expect(
    await page.locator("#main-content").evaluate((main) => main.scrollWidth <= main.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/questions-mobile.png",
    animations: "disabled",
    caret: "initial",
  });
});

test("unconfirmed class agenda stays off the calendar after class ends", async ({ page }) => {
  await page.goto("/session/linear-05");
  await page.locator("#main-sidebar").hover();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await page.getByRole("button", { name: "Akhiri", exact: true }).click();
  await page.getByRole("button", { name: "Selesaikan kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Catatan kelas", exact: true })).toBeVisible();
  await page.locator("#main-sidebar").hover();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Mahasiswa", exact: true }).click();
  await page.goto("/agenda");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Usulan dari kelas" })).toHaveCount(0);
  await expect(page.locator(".agenda-drafts")).toHaveCount(0);
  await expect(
    page.locator(".calendar-event").filter({ hasText: "Latihan matriks transformasi" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("clipthat-frontend-v1")!).agenda.find(
          (a: { id: string }) => a.id === "a4",
        ).confirmed,
    ),
  ).toBe(false);
});

test("agenda supports date selection, quick creation, edit, completion, export and delete", async ({
  page,
}) => {
  await page.goto("/agenda");
  await expect(page.getByRole("table", { name: /Agenda Oktober 2026/ })).toBeVisible();
  await expect(page.locator(".calendar-day")).toHaveCount(31);
  await expect(page.locator(".agenda-item")).toHaveCount(0);
  await expect(page.locator(".agenda-rail")).toHaveCount(0);
  await page.getByRole("button", { name: "Bulan berikutnya" }).click();
  await expect(page.getByRole("heading", { name: "November 2026" })).toBeVisible();
  await page.getByRole("button", { name: "Bulan sebelumnya" }).click();
  await expect(page.getByText("Perlu konfirmasi")).toHaveCount(0);
  await page.getByRole("button", { name: /^Kamis, 8 Oktober 2026, 1 agenda$/ }).click();
  await expect(page.locator(".agenda-item")).toContainText(["Kuis transformasi linear"]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Selasa, 13 Oktober 2026, 1 agenda$/ }).click();
  await expect(page.locator(".agenda-item")).toContainText(["Review nilai harapan"]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tambah", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /^Selasa, 6 Oktober 2026, 1 agenda$/ }).click();
  await page.getByRole("button", { name: "Tambah agenda", exact: true }).click();
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
  await page.keyboard.press("Escape");
  await page.getByLabel("Opsi agenda").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh kalender (.ics)", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("clipthat-agenda.ics");
  await page.getByRole("button", { name: /^Selasa, 6 Oktober 2026, 2 agenda$/ }).click();
  await item.getByRole("button", { name: /^Edit/ }).click();
  await page.getByRole("button", { name: "Hapus agenda", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hapus agenda", exact: true }).click();
  await expect(item).toHaveCount(0);
});

test("lecturer marks spoken answers, updates map, ends class, archives, restores and creates a session", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#main-sidebar").hover();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link"),
  ).toHaveCount(2);
  await page
    .getByRole("link", { name: "Masuk kelas Transformasi linear di Aljabar Linear" })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /^Tersimpan/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ringkasan", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Jawabanmu")).toHaveCount(0);
  const question = page.locator(".question-card").filter({ hasText: "Kalau basisnya berubah" });
  await question.getByRole("button", { name: "Tandai sudah dijawab", exact: true }).click();
  await expect(question).toContainText("Dijawab di kelas");
  await question.getByRole("button", { name: "Batalkan tanda", exact: true }).click();
  await expect(question).not.toContainText("Dijawab di kelas");
  await question.getByRole("button", { name: "Tandai sudah dijawab", exact: true }).click();
  await page.reload();
  await expect(question).toContainText("Dijawab di kelas");
  await expect(page.locator(".answer")).toHaveCount(0);
  await expect(page.getByLabel("Lainnya di kelas")).toHaveCount(0);
  await page.goto("/session/linear-05?tab=graph");
  await page.getByRole("button", { name: "Koreksi hubungan" }).click();
  await page.getByLabel("Jenis hubungan").selectOption("penerapan");
  await page.getByRole("button", { name: "Simpan hubungan" }).click();
  await page.getByLabel("Pilih subbab").selectOption("linear-05-0");
  await expect(page.locator(".graph-relations")).toContainText("penerapan");
  await page.getByRole("button", { name: "Akhiri", exact: true }).click();
  await page.getByRole("button", { name: "Selesaikan kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Catatan kelas", exact: true })).toBeVisible();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveCount(0);
  await page.goto("/classes/aljabar");
  await page.getByLabel("Opsi Transformasi linear").click();
  await page.getByRole("button", { name: "Arsipkan Transformasi linear" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arsipkan", exact: true }).click();
  await expect(
    page.locator(".course-session-card").filter({ hasText: "Transformasi linear" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Arsip (1)" }).click();
  await page.getByRole("button", { name: "Pulihkan" }).click();
  await expect(
    page.locator(".course-session-card").filter({ hasText: "Transformasi linear" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Buat sesi", exact: true }).click();
  const backdrop = await page.getByRole("dialog").evaluate((dialog) => {
    const style = getComputedStyle(dialog, "::backdrop");
    return { color: style.backgroundColor, filter: style.backdropFilter };
  });
  expect(backdrop).toEqual({ color: "rgba(46, 81, 69, 0.6)", filter: "none" });
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
      "/classes/aljabar/materials",
      "/session/linear-05",
      "/session/basis-04",
      "/classes/algoritma",
      "/agenda",
      "/settings",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(page.locator(".processing")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Selamat datang, Davin" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("home shows its course and reminder bento without desktop scrolling", async ({ page }) => {
  for (const { width, height } of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".home-course-row")).toHaveCount(4);
    await expect(page.locator(".home-course-row small, .home-course-top > svg")).toHaveCount(0);
    await expect(page.locator(".home-course-live")).toHaveCount(1);
    await expect(page.locator(".home-latest-notification")).toHaveCount(1);
    const panel = await page.locator(".home-reminders").boundingBox();
    const notification = await page.locator(".home-latest-notification").boundingBox();
    expect(panel!.x + panel!.width - (notification!.x + notification!.width)).toBeLessThanOrEqual(
      20,
    );
    await expect(page.locator(".home-calendar-day")).toHaveCount(31);
    const courseList = await page.locator(".home-course-list").boundingBox();
    const calendar = await page.locator(".home-calendar").boundingBox();
    expect(
      Math.abs(courseList!.height - calendar!.height),
      `Equal Home panels at ${width}px`,
    ).toBeLessThanOrEqual(1);
    const { scrollHeight, clientHeight } = await page.locator(".main-wrapper").evaluate((main) => ({
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
    }));
    expect(scrollHeight, `Home at ${width}x${height}`).toBeLessThanOrEqual(clientHeight + 1);
  }
  await page.getByRole("button", { name: /^Rabu, 7 Oktober 2026, 1 agenda$/ }).click();
  await expect(page.locator(".home-calendar-selection")).toContainText("Tugas rekursi");
  await page.getByRole("link", { name: "Pelajari Algoritma & Pemrograman" }).click();
  await expect(page).toHaveURL(/\/classes\/algoritma$/);
  await expect(page.getByRole("heading", { name: "Algoritma & Pemrograman" })).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Bulan berikutnya" }).click();
  await expect(page.locator(".home-calendar-header h3")).toHaveText("November 2026");
});

test("home notification modal tracks handled items without adding a sidebar item", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link"),
  ).toHaveCount(3);
  await expect(page.locator(".desktop-notification-shortcut")).toHaveCount(0);
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(page).toHaveURL(/\/$/);
  const dialog = page.getByRole("dialog", { name: "Notifikasi" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".notifications-meta")).toHaveCount(0);
  await expect(dialog.locator(".notification-card")).toHaveCount(3);
  await expect(dialog.locator(".notification-card time")).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: /Tandai belum diatasi: Rangkuman/ }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: /Tandai sudah diatasi: 2 bagian ingin kamu ulangi/ })
    .click();
  await expect(
    dialog.getByRole("button", { name: /Tandai belum diatasi: 2 bagian ingin kamu ulangi/ }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: /Tandai sudah diatasi: 1 agenda kelas perlu dikonfirmasi/ })
    .click();
  await expect(page.getByText("Semua sudah tertangani.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Notifikasi" })
      .getByRole("button", { name: /Tandai belum diatasi: 2 bagian ingin kamu ulangi/ }),
  ).toBeVisible();
  await dialog.getByRole("link", { name: /2 bagian ingin kamu ulangi/ }).click();
  await expect(page).toHaveURL(/\/classes\/aljabar$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(page.getByRole("dialog", { name: "Notifikasi" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/notifications-mobile.png",
    animations: "disabled",
    caret: "initial",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Notifikasi" })).not.toBeVisible();
});

test("live heading clock and page padding stay consistent across main views", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-10T03:30:00Z") });
  const paths = [
    "/",
    "/classes",
    "/classes/aljabar",
    "/classes/aljabar/materials",
    "/session/linear-05",
    "/agenda",
    "/settings",
  ];
  let homeLeft = 0;
  let homeTitleSize = "";
  for (const path of paths) {
    await page.goto(path);
    const clock = page.getByLabel("Waktu saat ini");
    await expect(clock).toHaveCount(1);
    await expect(page.locator("#main-sidebar").getByLabel("Waktu saat ini")).toHaveCount(0);
    await expect(
      page.locator("#main-content .page-heading:visible").getByLabel("Waktu saat ini"),
    ).toBeVisible();
    await expect(clock).toContainText("Sabtu, 10 Oktober 2026");
    await expect(clock).toContainText("10.30 WIB");
    const left = await page
      .locator(".page-container")
      .evaluate(
        (element) =>
          element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).paddingLeft),
      );
    const title = page.locator("h1").first();
    const titleLeft = (await title.boundingBox())!.x;
    const clockBox = (await clock.boundingBox())!;
    const titleBox = (await title.boundingBox())!;
    expect(clockBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
    expect(clockBox.y).toBeLessThan(titleBox.y + titleBox.height);
    expect(clockBox.y + clockBox.height).toBeGreaterThan(titleBox.y);
    const titleSize = await title.evaluate((element) => getComputedStyle(element).fontSize);
    if (path === "/") {
      homeLeft = left;
      homeTitleSize = titleSize;
    } else {
      expect(left).toBe(homeLeft);
      expect(titleSize).toBe(homeTitleSize);
    }
    expect(titleLeft).toBe(homeLeft);
  }
  await page.clock.fastForward(60_000);
  await expect(page.getByLabel("Waktu saat ini")).toContainText("10.31 WIB");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of paths) {
    await page.goto(path);
    const clock = page.locator("#main-content .page-heading:visible").getByLabel("Waktu saat ini");
    await expect(clock).toBeVisible();
    const clockBox = (await clock.boundingBox())!;
    const titleBox = (await page.locator("h1").first().boundingBox())!;
    expect(clockBox.x).toBeGreaterThanOrEqual(titleBox.x + titleBox.width);
    expect(clockBox.x + clockBox.width).toBeLessThanOrEqual(390);
    expect(clockBox.y).toBe(titleBox.y);
    expect(
      await page.locator(".main-wrapper").evaluate((el) => el.scrollWidth),
    ).toBeLessThanOrEqual(390);
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
  await expect(page.getByRole("button", { name: /Foto kamu · 17:20/ })).toBeVisible();
  await page.getByRole("button", { name: /Foto kamu · 17:20/ }).click();
  await expect(
    page.getByRole("dialog").getByRole("img", { name: "Foto papan · 17:20", exact: true }),
  ).toBeVisible();
});

test("personal item in a course opens beside its source lesson", async ({ page }) => {
  await page.goto("/classes/aljabar");
  await page.getByRole("link", { name: "1 bagian ditandai" }).click();
  await expect(page).toHaveURL(/session\/basis-04\?tab=notes/);
  await page.getByRole("button", { name: /Menentukan basis sebuah ruang/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Menentukan basis sebuah ruang");
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(page.getByRole("heading", { name: "Catatan kelas" })).toBeVisible();
});

test("a private bookmark remains available when its lesson is archived", async ({ page }) => {
  await page.goto("/classes/aljabar");
  await page.locator("#main-sidebar").hover();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await page.getByLabel("Opsi Basis dan dimensi").click();
  await page.getByRole("button", { name: "Arsipkan Basis dan dimensi" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arsipkan", exact: true }).click();
  await page.locator("#main-sidebar").hover();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Mahasiswa", exact: true }).click();
  await page.getByRole("button", { name: "Menentukan basis sebuah ruang" }).click();
  await expect(page.getByRole("dialog")).toContainText("Menentukan basis sebuah ruang");
});

test("calendar preferences remain explicit about connection state and reset works", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.locator(".settings-calendars:visible > summary").click();
  await page.getByRole("button", { name: "Atur tujuan" }).first().click();
  await page.getByLabel("Nama kalender tujuan").fill("Kuliah semester 3");
  await page.getByRole("button", { name: "Simpan tujuan" }).click();
  await expect(page.getByText("Tujuan: Kuliah semester 3 · belum terhubung")).toBeVisible();
  await page.reload();
  await page.locator(".settings-calendars:visible > summary").click();
  await expect(page.getByText("Tujuan: Kuliah semester 3 · belum terhubung")).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset sekarang", exact: true }).click();
  await expect(page.getByText("Belum terhubung", { exact: true })).toHaveCount(3);
});

test("login and registration remain readable on phone, tablet and desktop", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/login", "/register"]) {
      await page.goto(path);
      await expect(page.getByRole("button", { name: "Lanjutkan dengan Google" })).toBeVisible();
      await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      if (width === 390)
        await page.screenshot({
          path: `docs/screenshots/${path.slice(1)}-mobile.png`,
          animations: "disabled",
          caret: "initial",
        });
    }
  }
  await page.getByRole("button", { name: "Lanjutkan dengan Google" }).click();
  await expect(page.locator(".field-error")).toContainText(
    "Google Sign-In tersedia setelah mode live",
  );
});

test("graph stays static while topic details work on desktop and phone", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/session/linear-05?tab=materials&view=graph");
    await expect(page.getByLabel("Peta konsep interaktif")).toBeVisible();
    const graph = page.getByLabel("Peta konsep interaktif");
    await expect(graph.getByRole("textbox", { name: "Cari subbab" })).toHaveCount(0);
    const cards = graph.locator(".graph-topic-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().locator("span")).toHaveText(
      "Ruang vektor, Penjumlahan, Perkalian skalar",
    );
    await expect(cards.first()).not.toContainText("Pemetaan dari satu ruang vektor");
    await expect(
      graph.getByRole("button", {
        name: /Perbesar peta|Perkecil peta|Tampilkan seluruh peta|Peta layar penuh/,
      }),
    ).toHaveCount(0);
    const boxes = await cards.evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().y));
    expect(boxes[0]).toBeLessThan(boxes[1]);
    expect(boxes[1]).toBeLessThan(boxes[2]);
    await graph.screenshot({
      path: `docs/screenshots/graph-${width === 390 ? "mobile" : "desktop"}.png`,
      animations: "disabled",
      caret: "initial",
    });
    await cards.first().click();
    await expect(page.locator(".graph-node-detail")).toContainText("Apa itu transformasi linear?");
    await expect(page.locator(".graph-node-detail")).toContainText(
      "Pemetaan dari satu ruang vektor",
    );
    await expect(cards.first()).toHaveAttribute("aria-pressed", "true");
    if (width === 390) await expect(page.locator(".graph-node-detail")).toBeInViewport();
    await page.getByLabel("Tutup detail subbab").click();
    await cards.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".graph-node-detail")).toContainText("Dari vektor ke matriks");
    await page.getByLabel("Pilih subbab").selectOption({ index: 1 });
    await expect(page.locator(".graph-node-detail")).toContainText("Apa itu transformasi linear?");
    const initialWidth = (await cards.nth(1).boundingBox())!.width;
    const viewport = graph.locator(".graph-viewport");
    await viewport.scrollIntoViewIfNeeded();
    const box = (await viewport.boundingBox())!;
    const initialX = (await cards.nth(1).boundingBox())!.x;
    await page.mouse.move(box.x + 12, box.y + 32);
    await page.mouse.down();
    await page.mouse.move(box.x + 52, box.y + 32, { steps: 8 });
    await page.mouse.up();
    expect((await cards.nth(1).boundingBox())!.x).toBeCloseTo(initialX);
    await page.mouse.wheel(0, 200);
    expect((await cards.nth(1).boundingBox())!.width).toBeCloseTo(initialWidth);
    await page.getByLabel("Tutup detail subbab").click();
    await expect(page.locator(".graph-node-detail")).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("save current desktop and mobile design previews", async ({ page }) => {
  for (const [path, name] of [
    ["/", "dashboard"],
    ["/classes/aljabar", "course"],
    ["/classes/aljabar/materials", "course-materials"],
    ["/session/linear-05", "classroom"],
    ["/session/basis-04", "summary"],
    ["/agenda", "agenda"],
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
      animations: "disabled",
      caret: "initial",
    });
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(page.getByRole("dialog", { name: "Notifikasi" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/notifications.png",
    animations: "disabled",
    caret: "initial",
  });
  await page.goto("/agenda");
  await page.getByRole("button", { name: /^Selasa, 6 Oktober 2026, 1 agenda$/ }).click();
  await page.getByRole("button", { name: "Tambah agenda", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/modal.png",
    animations: "disabled",
    caret: "initial",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Selamat datang, Davin" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto("/agenda");
  await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/agenda-mobile.png",
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
});
