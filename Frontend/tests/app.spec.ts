import { expect, test } from "@playwright/test";

test("course shows schedule, overall summary, nearest agenda and past class sources", async ({
  page,
}) => {
  await page.goto("/classes/aljabar");
  const main = page.locator("#main-content");
  await expect(page.locator("#main-content .course-meta")).toContainText("Dr. Nadia Putri");
  await expect(page.locator("#main-content .course-meta")).toContainText(
    "Senin & Kamis · 09.00–10.30",
  );
  await expect(main.locator(".course-agenda-panel")).toContainText(
    "Kuis basis dan transformasi linear",
  );
  const live = main.locator(".course-session-card").filter({ hasText: "Transformasi linear" });
  await expect(live.getByRole("link")).toHaveCount(1);
  await expect(live.getByRole("link", { name: "Masuk kelas" })).toBeVisible();
  await main.locator(".course-summary-panel").getByRole("link", { name: "Lihat materi" }).click();
  await expect(page).toHaveURL(/classes\/aljabar\/materials/);
  await expect(main).toContainText("Basis adalah himpunan vektor");
  await expect(main.getByLabel("Alur konsep materi")).toContainText("Dimensi");
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
  await page.goto("/classes/algoritma");
  await expect(main.locator(".course-summary-panel")).toContainText("Belum ada rangkuman materi.");
});

test("completed classes preserve their history without student or lecturer editing controls", async ({
  page,
}) => {
  await page.goto("/session/basis-04?tab=transcript");
  await expect(page.locator(".transcript-segment.marked")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Capture 90 detik" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tambahkan foto" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^(Simpan bagian|Hapus penanda)/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Tersimpan (1)" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Menentukan basis sebuah ruang/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Basis adalah himpunan vektor");
  await expect(page.getByRole("button", { name: "Hapus bagian pribadi" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sudah paham", exact: true })).toHaveCount(0);
  await page.getByRole("dialog").getByRole("button", { name: "Tutup dialog" }).click();
  await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
  await expect(page.locator(".question-card")).toContainText("Bagaimana mengecek");
  await expect(page.getByLabel("Pertanyaan anonim")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^(Dukung pertanyaan|Batalkan dukungan)/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("6 dukungan saat kelas")).toBeVisible();
  await page.getByRole("button", { name: "Ringkasan", exact: true }).click();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveCount(0);
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /^(Jawab|Edit jawaban|Sudah dibahas)$/ }),
  ).toHaveCount(0);
  await page.getByLabel("Lainnya di kelas").click();
  await page.getByRole("button", { name: "Peta konsep", exact: true }).click();
  await expect(page.getByRole("button", { name: "Koreksi hubungan" })).toHaveCount(0);
  await page.getByLabel("Lainnya di kelas").click();
  await page.getByRole("button", { name: "Materi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tambah materi" })).toHaveCount(0);
  await expect(page.getByLabel("Unggah materi")).toHaveCount(0);
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
  await expect(trigger).toHaveText("Dosen");
  await trigger.click();
  await page.getByRole("button", { name: "Mahasiswa", exact: true }).click();
  await expect(page.locator(".profile strong")).toHaveText("Davin Farel");
});

test("simple navigation, one-tap capture, bookmarks and personal review", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Selamat datang, Davin" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(3);
  await expect(page.locator("main").getByRole("heading", { name: "Kalender" })).toBeVisible();
  await expect(page.locator(".active-class")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Masuk kelas Transformasi linear di Aljabar Linear" })
    .first()
    .click();
  await expect(page).toHaveURL(/session\/linear-05/);
  await page.getByRole("link", { name: "Course", exact: true }).click();
  await expect(page.getByRole("button", { name: "Gabung kelas" })).toHaveCount(0);
  await page.locator(".course-tile").filter({ hasText: "Aljabar Linear" }).click();
  await expect(page).toHaveURL(/classes\/aljabar/);
  await expect(page.getByRole("link", { name: "Buka rangkuman kelas" })).toBeVisible();
  await page.getByRole("link", { name: "Masuk kelas" }).click();
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
  await page.getByRole("button", { name: "Ringkasan", exact: true }).click();
  await page.locator(".personal-note summary").click();
  await page.getByLabel("Catatan pribadimu").fill("Ulangi representasi matriks besok.");
  await page.reload();
  await page.locator(".personal-note summary").click();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveValue(
    "Ulangi representasi matriks besok.",
  );
  await page
    .locator(".personal-results")
    .getByRole("button", { name: /Representasi matriks/ })
    .click();
  await page.getByRole("dialog").getByRole("link", { name: "Buka kelas", exact: true }).click();
  await expect(page.getByRole("button", { name: "Capture 90 detik" })).toBeVisible();
  await page.goto("/classes/aljabar");
  await page.getByRole("link", { name: "Masuk kelas" }).click();
  await page.getByRole("button", { name: "Ringkasan", exact: true }).click();
  await page.getByRole("button", { name: /Capture · 17:00/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sudah paham", exact: true }).click();
  await expect(page.getByRole("button", { name: /Capture · 17:00/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("agenda supports confirmation, quick creation, edit, completion, export and delete", async ({
  page,
}) => {
  await page.goto("/agenda");
  await expect(page.getByRole("table", { name: /Agenda Oktober 2026/ })).toBeVisible();
  await expect(page.locator(".calendar-day")).toHaveCount(31);
  await expect(page.locator(".agenda-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Bulan berikutnya" }).click();
  await expect(page.getByRole("heading", { name: "November 2026" })).toBeVisible();
  await page.getByRole("button", { name: "Bulan sebelumnya" }).click();
  await page.getByRole("button", { name: "Tinjau", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Pengumuman kelas");
  await page.getByRole("dialog").getByRole("button", { name: "Konfirmasi agenda" }).click();
  await expect(page.locator(".agenda-item")).toContainText(["Latihan matriks transformasi"]);
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
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(2);
  await page
    .getByRole("link", { name: "Masuk kelas Transformasi linear di Aljabar Linear" })
    .first()
    .click();
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
  await expect(
    page.getByRole("heading", { name: "Yang dipelajari hari ini", exact: true }),
  ).toBeVisible();
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
      await expect(page.locator(".processing")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Home", exact: true }).click();
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
    .getByRole("button", { name: /Tandai sudah diatasi: 1 agenda perlu konfirmasi/ })
    .click();
  await expect(
    dialog.getByRole("button", { name: /Tandai belum diatasi: 1 agenda perlu konfirmasi/ }),
  ).toBeVisible();
  await expect(page.locator(".home-latest-notification")).toContainText(
    "2 bagian ingin kamu ulangi",
  );
  await page.reload();
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Notifikasi" })
      .getByRole("button", { name: /Tandai belum diatasi: 1 agenda perlu konfirmasi/ }),
  ).toBeVisible();
  await dialog.getByRole("link", { name: /1 agenda perlu konfirmasi/ }).click();
  await expect(page).toHaveURL(/\/agenda$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(page.getByRole("dialog", { name: "Notifikasi" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/notifications-mobile.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Notifikasi" })).not.toBeVisible();
});

test("live sidebar clock and page padding stay consistent across main views", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-10T03:30:00Z") });
  const paths = ["/", "/classes", "/classes/aljabar", "/session/linear-05", "/agenda", "/settings"];
  let homeLeft = 0;
  let homeTitleSize = "";
  for (const path of paths) {
    await page.goto(path);
    const clock = page.getByLabel("Waktu saat ini");
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
  await page.goto("/");
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await expect(page.getByLabel("Waktu saat ini")).toBeVisible();
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
  await page.getByRole("button", { name: "Tersimpan (1)" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Foto papan · 17:20/ })
    .click();
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
  await expect(page.getByRole("heading", { name: "Yang dipelajari hari ini" })).toBeVisible();
});

test("a private bookmark remains available when its lesson is archived", async ({ page }) => {
  await page.goto("/classes/aljabar");
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Dosen", exact: true }).click();
  await page.getByLabel("Opsi Basis dan dimensi").click();
  await page.getByRole("button", { name: "Arsipkan Basis dan dimensi" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arsipkan", exact: true }).click();
  await page.getByRole("button", { name: "Pilih peran demo" }).click();
  await page.getByRole("button", { name: "Mahasiswa", exact: true }).click();
  await page.getByRole("button", { name: "Menentukan basis sebuah ruang" }).click();
  await expect(page.getByRole("dialog")).toContainText("Menentukan basis sebuah ruang");
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
    });
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Lihat lengkapnya" }).click();
  await expect(page.getByRole("dialog", { name: "Notifikasi" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/notifications.png",
    animations: "disabled",
  });
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Tambah", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/modal.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Selamat datang, Davin" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto("/agenda");
  await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/agenda-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
