import { expect, test } from "@playwright/test";

test("student joins, captures, bookmarks, asks, and keeps saved work after reload", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hai, Davin" })).toBeVisible();
  await page.getByRole("button", { name: "Gabung kelas", exact: true }).click();
  await page.getByLabel("Kode kelas").fill("WRONG");
  await page.getByRole("dialog").getByRole("button", { name: "Gabung kelas" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Kode belum ditemukan");
  await page.getByLabel("Kode kelas").fill("alg05");
  await page.getByRole("dialog").getByRole("button", { name: "Gabung kelas" }).click();
  await expect(page).toHaveURL(/session\/linear-05/);
  await page.getByRole("button", { name: "Bingung", exact: true }).nth(3).click();
  await expect(page.getByRole("button", { name: "Bingung", exact: true }).nth(3)).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Capture 90 detik" }).click();
  await expect(page.getByRole("dialog")).toContainText("17:00 – 18:30");
  await expect(page.getByRole("dialog")).toContainText("kolom pertama");
  await page.getByLabel("Draf pertanyaan capture").fill("Apakah rotasi juga transformasi linear?");
  await page.getByRole("button", { name: "Kirim anonim", exact: true }).click();
  await page.getByRole("button", { name: /^Pertanyaan/ }).click();
  await expect(page.getByText("Apakah rotasi juga transformasi linear?", { exact: true })).toBeVisible();
  const vote = page.getByRole("button", { name: "Dukung pertanyaan: Apakah rotasi juga transformasi linear?" });
  await vote.click();
  await expect(page.getByRole("button", { name: "Batalkan dukungan: Apakah rotasi juga transformasi linear?" })).toContainText("1");
  await page.getByRole("button", { name: "Batalkan dukungan: Apakah rotasi juga transformasi linear?" }).click();
  await expect(vote).toContainText("0");
  await page.reload();
  await expect(page.getByText("Apakah rotasi juga transformasi linear?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Catatan", exact: true }).click();
  await page.getByLabel("Catatan pribadimu").fill("Ulangi representasi matriks besok.");
  await page.reload();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveValue("Ulangi representasi matriks besok.");
  await page.locator(".saved-panel").getByRole("button", { name: /Representasi matriks/ }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Lihat pembahasan" }).click();
  await expect(page.getByRole("button", { name: "Capture 90 detik" })).toBeVisible();
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Capture · 17:00" })).toBeVisible();
  const card = page.locator(".saved-card").filter({ hasText: "Capture · 17:00" });
  await card.getByRole("button", { name: "Buka" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sudah paham", exact: true }).click();
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("agenda requires confirmation and supports edit, completion, export and delete", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page.locator(".agenda-item")).toHaveCount(3);
  await page.getByRole("button", { name: "Tinjau agenda" }).click();
  await expect(page.getByRole("dialog")).toContainText("Pengumuman kelas");
  await page.getByRole("button", { name: "Konfirmasi agenda" }).click();
  await expect(page.locator(".agenda-item")).toHaveCount(4);
  await page.getByRole("button", { name: "Tambah agenda", exact: true }).first().click();
  await page.getByLabel("Judul agenda").fill("Belajar bareng Dinda");
  await page.getByLabel("Tanggal", { exact: true }).fill("2026-10-06");
  await page.getByRole("button", { name: "Simpan agenda" }).click();
  await expect(page.getByRole("heading", { name: "Belajar bareng Dinda" })).toBeVisible();
  await page.getByRole("button", { name: "Edit Belajar bareng Dinda" }).click();
  await page.getByLabel("Judul agenda").fill("Belajar bareng Dinda & Rani");
  await page.getByRole("button", { name: "Simpan agenda" }).click();
  const item = page.locator(".agenda-item").filter({ hasText: "Belajar bareng Dinda & Rani" });
  await item.getByRole("button", { name: /^Selesaikan:/ }).click();
  await expect(item).toHaveClass(/done/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh kalender (.ics)", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("clipthat-agenda.ics");
  await item.getByRole("button", { name: /^Edit/ }).click();
  await page.getByRole("button", { name: "Hapus agenda", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hapus agenda", exact: true }).click();
  await expect(item).toHaveCount(0);
});

test("lecturer answers, edits graph, starts and ends a class, archives and restores", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Pilih peran demo").selectOption("lecturer");
  await expect(page.getByRole("heading", { name: "Selamat pagi, Bu Nadia" })).toBeVisible();
  await page.getByRole("link", { name: "Buka ruang kelas" }).click();
  await expect(page.getByText("Tersimpan untukmu", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: /^Pertanyaan/ }).click();
  await page.getByRole("button", { name: "Jawab", exact: true }).first().click();
  await page.getByLabel("Jawabanmu").fill("Ya, representasinya bergantung pada basis yang dipakai.");
  await page.getByRole("button", { name: "Simpan jawaban" }).click();
  await expect(page.locator(".answer").filter({ hasText: "Ya, representasinya bergantung pada basis yang dipakai." })).toBeVisible();
  await page.getByRole("button", { name: "Peta materi", exact: true }).click();
  await page.getByRole("button", { name: "Koreksi hubungan" }).click();
  await page.getByLabel("Jenis hubungan").selectOption("penerapan");
  await page.getByRole("button", { name: "Simpan hubungan" }).click();
  await expect(page.locator(".concept-edge").first()).toHaveText("penerapan");
  await page.getByRole("button", { name: "Akhiri kelas" }).click();
  await page.getByRole("button", { name: "Selesaikan kelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Inti pembahasan" })).toBeVisible();
  await expect(page.getByLabel("Catatan pribadimu")).toHaveCount(0);
  await page.goto("/classes/aljabar");
  await page.getByRole("button", { name: "Arsipkan Transformasi linear" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arsipkan", exact: true }).click();
  await expect(page.getByRole("link", { name: "Buka Transformasi linear", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Arsip (1)" }).click();
  await page.getByRole("button", { name: "Pulihkan" }).click();
  await expect(page.getByRole("link", { name: "Buka Transformasi linear", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Buat sesi", exact: true }).click();
  await page.getByLabel("Topik pertemuan").fill("Nilai eigen");
  await page.getByRole("button", { name: "Buat sesi kelas" }).click();
  await expect(page.getByRole("heading", { name: "Nilai eigen", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mulai kelas", exact: true }).click();
  await expect(page.getByText("Kelas berlangsung", { exact: true })).toBeVisible();
});

test("all main views render without errors or horizontal overflow on desktop and mobile", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const path of ["/", "/classes", "/classes/aljabar", "/session/linear-05", "/session/basis-04", "/review", "/agenda", "/settings"]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator(".processing")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${path} at ${width}px`).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("link", { name: "Beranda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hai, Davin" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("photo stays private and connects to a valid timestamp", async ({ page }) => {
  await page.goto("/session/linear-05");
  await page.getByRole("button", { name: /Tambahkan foto/ }).click();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=", "base64");
  await page.getByLabel("Foto papan atau slide").setInputFiles({ name: "papan.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Waktu dalam transkrip").fill("99:00");
  await page.getByRole("button", { name: "Simpan foto" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("00:00–18:30");
  await page.getByLabel("Waktu dalam transkrip").fill("17:20");
  await page.getByRole("button", { name: "Simpan foto" }).click();
  await expect(page.getByRole("button", { name: /Foto papan · 17:20/ })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Foto papan · 17:20/ }).click();
  await expect(page.getByRole("dialog").getByRole("img", { name: "Foto papan · 17:20", exact: true })).toBeVisible();
});

test("calendar configuration is honest about connection status and reset works", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Atur tujuan" }).first().click();
  await page.getByLabel("Nama kalender tujuan").fill("Kuliah semester 3");
  await page.getByRole("button", { name: "Simpan tujuan" }).click();
  await expect(page.getByText("Tujuan: Kuliah semester 3 · belum terhubung")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Tujuan: Kuliah semester 3 · belum terhubung")).toBeVisible();
  await page.getByRole("button", { name: "Reset ruang demo" }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByText("Belum terhubung", { exact: true })).toHaveCount(3);
});

test("save desktop and mobile visual previews", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: "Hai, Davin" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/dashboard.png", fullPage: true, animations: "disabled" });
  await page.goto("/session/linear-05"); await expect(page.getByRole("button", { name: "Capture 90 detik" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/classroom.png", fullPage: true, animations: "disabled" });
  await page.goto("/agenda"); await expect(page.getByRole("heading", { name: "Satu hal dalam satu waktu." })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/agenda.png", fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/mobile.png", fullPage: true, animations: "disabled" });
});
