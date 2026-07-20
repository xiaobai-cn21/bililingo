import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("loads the extension, persists activation and survives Bilibili SPA navigation", async () => {
  const extensionPath = resolve("dist");
  const userDataDir = await mkdtemp(join(tmpdir(), "bilingo-playwright-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent("serviceworker");
    const extensionId = new URL(worker.url()).host;

    await context.route("https://www.bilibili.com/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html>
          <html><body>
            <div class="bpx-player-container" style="position:relative;width:960px;height:540px">
              <video style="width:960px;height:540px"></video>
              <div class="bpx-player-subtitle-text"
                style="position:absolute;left:300px;top:440px;width:360px;height:40px">
                我喜欢学习中文
              </div>
            </div>
          </body></html>`,
      }),
    );

    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/video/BV1TEST");
    await expect(page.locator("[data-bilingo-root]")).toHaveCount(1);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    const analysis = await popup.evaluate(() =>
      chrome.runtime.sendMessage({
        type: "bilingo:analyze-caption",
        text: "我喜欢学习中文",
      }),
    );
    expect(analysis.segments).toEqual(["我", "喜欢", "学习", "中文"]);
    const definition = await popup.evaluate(() =>
      chrome.runtime.sendMessage({
        type: "bilingo:lookup-word",
        surface: "喜欢",
      }),
    );
    expect(definition.source).toBe("CC-CEDICT");
    expect(definition.meaning).toMatch(/like|fond/i);

    const enabled = popup.locator("#enabled");
    await expect(enabled).not.toBeChecked();
    await enabled.check();
    await expect(popup.locator("#status")).toContainText("Enabled");

    await page.evaluate(() => {
      history.pushState({}, "", "/video/BV1NEXT");
      document.querySelector(".bpx-player-subtitle-text").textContent =
        "你们为什么喜欢";
    });
    await expect(page.locator("[data-bilingo-root]")).toHaveCount(1);

    await popup.reload();
    await expect(popup.locator("#enabled")).toBeChecked();
  } finally {
    await context.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
});
