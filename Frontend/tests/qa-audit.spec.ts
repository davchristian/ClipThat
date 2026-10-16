import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { initialState } from "../src/data/mock/initial-state";

const output = "docs/qa/2026-10-16";
for (const role of ["student", "lecturer"] as const) {
  for (const width of [390, 1440]) {
    test(`QA inventory and profile course grid: ${role} ${width}px`, async ({ page }) => {
      test.setTimeout(120000);
      mkdirSync(`${output}/screenshots`, { recursive: true });
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(
        (state) => {
          if (!localStorage.getItem("clipthat-frontend-v1"))
            localStorage.setItem("clipthat-frontend-v1", JSON.stringify(state));
        },
        { ...initialState, role },
      );
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const inventory = [];
      const paths = [
        "/",
        "/profile",
        "/classes",
        "/classes/aljabar",
        "/classes/aljabar/materials",
        "/session/linear-05?tab=questions",
        "/session/basis-04?tab=notes",
        "/agenda",
        "/login",
        "/register",
      ];
      for (const [index, path] of paths.entries()) {
        await page.goto(path);
        if (!["/login", "/register"].includes(path)) {
          await expect(page.locator(".sidebar-profile-avatar")).toHaveAttribute(
            "aria-label",
            role === "lecturer" ? "Buka profil Nadia Putri" : "Buka profil Davin Farel",
          );
        }
        await expect(page.locator("h1:visible, main h3:visible").first()).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          path,
        ).toBe(true);
        if (path === "/profile") {
          const heading = page.locator(".profile-section-heading:visible");
          await expect(heading).toContainText(role === "student" ? "diikuti" : "diajar");
          await expect(page.getByRole("link", { name: "Semua course" })).toHaveCount(0);
          await expect(page.locator(".profile-course-list:visible")).toHaveCSS("display", "grid");
          const h = await heading.boundingBox();
          const row = await page.locator(".profile-course-row:visible").first().boundingBox();
          expect(row!.y).toBeGreaterThanOrEqual(h!.y + h!.height);
        }
        const labels = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              "main small, main p, main .muted, main .page-intro, main .ask-form-footer span",
            ),
          )
            .filter((el) => {
              const style = getComputedStyle(el);
              const box = el.getBoundingClientRect();
              return (
                box.width > 0 &&
                box.height > 0 &&
                style.visibility !== "hidden" &&
                parseFloat(style.fontSize) <= 16
              );
            })
            .map((el) => ({
              text: (el.textContent || "").trim(),
              className: el.className,
              fontSize: getComputedStyle(el).fontSize,
            }))
            .filter((el) => el.text),
        );
        inventory.push({ path, labels });
        await page.screenshot({
          path: `${output}/screenshots/${role}-${width}-${index}.png`,
          fullPage: true,
          animations: "disabled",
        });
      }
      writeFileSync(
        `${output}/ui-labels-${role}-${width}.json`,
        JSON.stringify({ role, width, inventory, errors }, null, 2),
      );
      expect(errors).toEqual([]);
    });
  }
}

test("QA question grows for wrapped text, shrinks on clear and has no anonymous timestamp metadata", async ({
  page,
}) => {
  await page.goto("/session/linear-05?tab=questions");
  const input = page.getByLabel("Pertanyaan anonim");
  const height = await input.evaluate((el) => el.clientHeight);
  await input.fill("Mengapa matriks ini tidak memiliki invers? ".repeat(20));
  await expect.poll(() => input.evaluate((el) => el.clientHeight)).toBeGreaterThan(height);
  await expect(input).toHaveCSS("resize", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => input.evaluate((el) => el.scrollHeight <= el.clientHeight + 1))
    .toBe(true);
  await input.fill("");
  await expect.poll(() => input.evaluate((el) => el.clientHeight)).toBe(height);
  for (const card of await page.locator(".question-card").all()) {
    await expect(card).not.toContainText("Posisi rekaman");
    await expect(card).not.toContainText("Anonim");
  }
});

test("QA auth required fields, email format and password visibility", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Lanjutkan dengan Google" })).toHaveCount(0);
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL(/register/);
  await page.getByLabel("Nama lengkap", { exact: true }).fill("A");
  await page.getByLabel("Email", { exact: true }).fill("invalid-email");
  const password = page.getByLabel("Kata sandi", { exact: true });
  await password.fill("short");
  expect(
    await page.locator(".auth-form").evaluate((el) => (el as HTMLFormElement).checkValidity()),
  ).toBe(false);
  await page.getByRole("button", { name: "Tampilkan kata sandi" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sembunyikan kata sandi" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("QA invalid session and corrupt demo storage recover without a page crash", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("clipthat-frontend-v1", "{not-json"));
  await page.goto("/session/does-not-exist");
  await expect(page.getByRole("heading", { name: /tidak (tersedia|ditemukan)/ })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Selamat datang/ })).toBeVisible();
});

test("QA global search filters classes, handles no results, navigates and closes with Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Cari kelas" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "Cari kelas atau topik" })
    .fill("no-matching-course-qa");
  await expect(dialog).toContainText("Tidak ditemukan.");
  await dialog.getByRole("textbox", { name: "Cari kelas atau topik" }).fill("Transformasi linear");
  await dialog.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/session\//);
  await expect(dialog).toHaveCount(0);
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("QA diagnose retained route clocks and keyboard sidebar focus", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-10T03:30:00Z") });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("clipthat-frontend-v1")))
    .not.toBeNull();
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("clipthat-frontend-v1")!);
    state.role = "lecturer";
    localStorage.setItem("clipthat-frontend-v1", JSON.stringify(state));
  });
  const clocks = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.goto("/classes/aljabar");
    await expect(page.getByRole("button", { name: "Lanjutkan kelas", exact: true })).toBeVisible();
    clocks.push({
      width,
      total: await page.getByLabel("Waktu saat ini").count(),
      visible: await page.locator(".page-clock:visible").count(),
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/classes");
  await page.mouse.move(900, 200);
  await page.locator("#main-content").focus();
  await page.keyboard.press("Shift+Tab");
  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    outer: document.activeElement?.outerHTML.slice(0, 600),
    sidebar: Boolean(document.activeElement?.closest("#main-sidebar")),
  }));
  await page.waitForTimeout(300);
  const sidebarWidth = (await page.locator("#main-sidebar").boundingBox())!.width;
  writeFileSync(
    `${output}/clock-sidebar-diagnostic.json`,
    JSON.stringify({ clocks, focused, sidebarWidth }, null, 2),
  );
  for (const clock of clocks) expect(clock.visible).toBe(1);
});
