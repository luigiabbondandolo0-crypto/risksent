import { test, expect } from "@playwright/test";

/** Public routes: marketing + auth (no session required). */
const paths = [
  "/",
  "/pricing",
  "/journaling",
  "/contact",
  "/signup",
  "/login",
  "/mission",
  "/info",
  /** In-app chrome (demo) — sidebar + scroll region */
  "/mock/dashboard"
];

const viewports = [
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 960, height: 900, name: "half-desktop" },
  { width: 1280, height: 800, name: "desktop" }
];

for (const vp of viewports) {
  test.describe(`viewport ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
    });

    for (const path of paths) {
      test(`document has no horizontal overflow on ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await page.waitForTimeout(400);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        }));
        expect(
          scrollWidth,
          `scrollWidth ${scrollWidth} > clientWidth ${clientWidth} at ${path}`
        ).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
}
