import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthlyCost,
  parsePrices,
  providers,
  recordPrices,
  restoreState,
  type PriceState,
} from "../services/llm/pricing";
const payload = () => ({
  data: providers.map((p) => ({
    id: p.id,
    pricing: { prompt: "0.000001", completion: "0.000002" },
  })),
});
const baseline = (): PriceState => ({
  prices: parsePrices(payload()),
  checkedAt: "2026-09-27T00:00:00Z",
  watched: providers.map((p) => p.id),
  notices: [],
});
test("converts per-token rates and calculates a mixed workload", () => {
  const prices = parsePrices(payload());
  assert.equal(prices[0].input, 1);
  assert.equal(prices[0].output, 2);
  assert.equal(monthlyCost(prices[0], 1000000, 250000), 1.5);
  assert.equal(monthlyCost(prices[0], 0, 0), 0);
});
test("rejects incomplete or invalid upstream responses", () => {
  assert.throws(() => parsePrices({ data: [] }));
  for (const rate of ["", "-1", "NaN", "Infinity"]) {
    const source = payload();
    source.data[0].pricing.prompt = rate;
    assert.throws(() => parsePrices(source));
  }
});
test("records only watched drops, deduplicates unchanged checks, and allows later drops", () => {
  const previous = baseline();
  previous.watched = [providers[0].id];
  const prices = previous.prices.map((p) => ({ ...p, input: 0.5 }));
  const next = recordPrices(previous, prices, "2026-09-27T01:00:00Z");
  assert.equal(next.notices.length, 1);
  assert.equal(next.notices[0].before.input, 1);
  assert.equal(next.notices[0].after.input, 0.5);
  assert.equal(
    recordPrices(next, prices, "2026-09-27T02:00:00Z").notices.length,
    1,
  );
  const lower = prices.map((p) => ({ ...p, output: 1 }));
  assert.equal(
    recordPrices(next, lower, "2026-09-27T03:00:00Z").notices.length,
    2,
  );
});
test("restores persisted notices and watches, rejects corrupted storage", () => {
  const initial = baseline();
  const changed = recordPrices(
    initial,
    initial.prices.map((p) => ({ ...p, input: 0.5 })),
    "2026-09-27T01:00:00Z",
  );
  assert.deepEqual(restoreState(JSON.stringify(changed), initial), changed);
  for (const raw of [
    "broken",
    "null",
    "{}",
    JSON.stringify({ ...initial, prices: [] }),
    JSON.stringify({ ...initial, notices: [null] }),
  ]) {
    assert.deepEqual(restoreState(raw, initial), initial);
  }
});
