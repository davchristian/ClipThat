import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`focus mode uses native fullscreen and restores the classroom at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/session/linear-05?tab=transcript");
    const enter = page.getByRole("button", { name: "Focus Mode", exact: true });
    await enter.click();
    const exit = page.getByRole("button", { name: "Keluar Focus Mode", exact: true });
    await expect(exit).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement?.className))
      .toBe("classroom");
    await expect(page.locator(".session-heading")).toBeHidden();
    await expect(page.locator(".classroom > .breadcrumbs")).toBeHidden();
    await expect(page.getByRole("button", { name: "Capture 90 detik" })).toBeInViewport();
    const panel = (await page.locator(".transcript-panel").boundingBox())!;
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(panel.y + panel.height).toBeLessThanOrEqual(viewportHeight);

    await expect(page.locator(".transcript-toolbar button")).toHaveCount(0);
    await page.getByRole("button", { name: "Pertanyaan", exact: true }).click();
    await expect(page.locator(".questions-panel")).toBeVisible();
    await expect(exit).toHaveAttribute("aria-pressed", "true");
    await exit.click();
    await expect(page.locator(".session-heading")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);

    await enter.click();
    await expect(exit).toHaveAttribute("aria-pressed", "true");
    // Browser controls and Escape exit fullscreen independently of the app button.
    await page.evaluate(() => document.exitFullscreen());
    await expect(enter).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".session-heading")).toBeVisible();
  });
}
