import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  use: { baseURL: "http://127.0.0.1:4329", headless: true },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4329",
    url: "http://127.0.0.1:4329",
    reuseExistingServer: true,
  },
  reporter: "list",
});
