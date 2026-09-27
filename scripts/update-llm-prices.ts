import { writeFile } from "node:fs/promises";
import { PRICE_SOURCE, parsePrices } from "../services/llm/pricing";
const response = await fetch(PRICE_SOURCE, {
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error(`Price source returned ${response.status}`);
const prices = parsePrices(await response.json());
await writeFile(
  new URL("../services/llm/snapshot.json", import.meta.url),
  JSON.stringify({ checkedAt: new Date().toISOString(), prices }, null, 2) +
    "\n",
);
console.log(`Updated ${prices.length} public LLM prices.`);
