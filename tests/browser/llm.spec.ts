import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { TokenPrice } from "../../services/llm/pricing";
const snapshot = JSON.parse(
  readFileSync(
    new URL("../../services/llm/snapshot.json", import.meta.url),
    "utf8",
  ),
) as { prices: TokenPrice[] };
import { PRICE_SOURCE } from "../../services/llm/pricing";

test("existing sections, calculator, watches, drop notice, reload, and failed refresh", async ({
  page,
}) => {
  let failed = false;
  const data = snapshot.prices.map((price) => ({
    id: price.id,
    pricing: {
      prompt: String(price.input / 1e6),
      completion: String(price.output / 1e6),
    },
  }));
  await page.route("https://**/*", async (route) => {
    if (route.request().url() === PRICE_SOURCE)
      await route.fulfill({ status: failed ? 503 : 200, json: { data } });
    else await route.abort();
  });
  await page.goto("/");
  await expect(page.locator("#email")).toHaveText("Email");
  await expect(page.locator("#authentication")).toHaveText("Authentication");
  await page.getByRole("link", { name: "LLM Providers", exact: true }).click();
  await expect(page).toHaveURL(/#llm$/);
  await expect(page.locator("#llm-rows tr")).toHaveCount(6);
  await expect(page.locator("#llm-status")).toContainText("Prices checked");
  await expect(page.locator("#llm-chart svg").first()).toBeVisible();
  await page.getByLabel("Monthly input tokens").fill("2000000");
  await expect(page.locator("#llm-cheapest")).toContainText("$0.0455");
  const watch = page.getByRole("checkbox", {
    name: "Watch Mistral Nemo",
    exact: true,
  });
  await watch.uncheck();
  await page.reload();
  await expect(watch).not.toBeChecked();
  await watch.check();
  const nemo = data.find((price) => price.id === "mistralai/mistral-nemo")!;
  nemo.pricing.prompt = String(Number(nemo.pricing.prompt) / 2);
  await page.getByRole("button", { name: "Refresh LLM prices" }).click();
  await expect(page.locator("#llm-notices li")).toHaveCount(1);
  await expect(page.locator("#llm-notices")).toContainText(
    "Mistral Nemo price dropped",
  );
  await expect(page.locator("#llm-notices")).toContainText("$0.019 → $0.0095");
  await page.reload();
  await expect(page.locator("#llm-status")).toContainText("Prices checked");
  await expect(page.locator("#llm-notices li")).toHaveCount(1);
  await page.getByRole("button", { name: "Refresh LLM prices" }).click();
  await expect(page.locator("#llm-notices li")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear notices" }).click();
  await expect(page.locator("#llm-notices")).toContainText(
    "No price drops recorded",
  );
  failed = true;
  await page.getByRole("button", { name: "Refresh LLM prices" }).click();
  await expect(page.locator("#llm-status")).toContainText(
    "Could not refresh prices",
  );
  await expect(page.locator("#llm-rows tr")).toHaveCount(6);
  await page
    .locator("#llm")
    .screenshot({ path: "node_modules/.cache/llm-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#llm").scrollIntoViewIfNeeded();
  expect(
    await page
      .locator("#llm")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  await expect
    .poll(() =>
      page
        .locator("#llm-chart svg")
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeLessThanOrEqual(350);
  await page
    .locator("#llm")
    .screenshot({ path: "node_modules/.cache/llm-mobile.png" });
});

test("unavailable browser storage keeps the comparison usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.route(PRICE_SOURCE, (route) =>
    route.fulfill({
      json: {
        data: snapshot.prices.map((price) => ({
          id: price.id,
          pricing: {
            prompt: String(price.input / 1e6),
            completion: String(price.output / 1e6),
          },
        })),
      },
    }),
  );
  await page.goto("/#llm");
  await expect(page.locator("#llm-storage")).toContainText(
    "Could not save to browser storage",
  );
  await expect(page.locator("#llm-rows tr")).toHaveCount(6);
  await page.getByLabel("Monthly input tokens").fill("-1");
  await expect(page.locator("#llm-status")).toContainText("Enter token counts");
  await page.getByLabel("Monthly input tokens").fill("1000000");
  await expect(page.locator("#llm-cheapest")).toContainText("$0.0265");
});
