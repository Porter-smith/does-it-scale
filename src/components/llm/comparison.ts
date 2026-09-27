import ApexCharts from "apexcharts";
import snapshot from "@services/llm/snapshot.json";
import {
  PRICE_SOURCE,
  providers,
  monthlyCost,
  parsePrices,
  recordPrices,
  restoreState,
  type PriceState,
} from "@services/llm/pricing";

const storageKey = "does-it-scale:llm-prices:v1";
const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const input = element<HTMLInputElement>("llm-input");
const output = element<HTMLInputElement>("llm-output");
const refresh = element<HTMLButtonElement>("llm-refresh");
const status = element<HTMLParagraphElement>("llm-status");
const clear = element<HTMLButtonElement>("llm-clear");
let state: PriceState = {
  ...snapshot,
  watched: providers.map((p) => p.id),
  notices: [],
};
try {
  state = restoreState(localStorage.getItem(storageKey), state);
} catch {
  element("llm-storage").textContent =
    "Browser storage is unavailable. Watches and notices will last only for this visit.";
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
const model = (id: string) => providers.find((p) => p.id === id)!;
const chartSeries = () =>
  providers.map((provider) => ({
    name: provider.provider,
    data: [100000, 1000000, 10000000, 100000000].map((tokens) =>
      monthlyCost(
        state.prices.find((p) => p.id === provider.id)!,
        tokens * 0.8,
        tokens * 0.2,
      ),
    ),
  }));
const chart = new ApexCharts(element("llm-chart"), {
  chart: {
    type: "area",
    height: 320,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "Inter, sans-serif",
  },
  series: chartSeries(),
  colors: providers.map((p) => p.color),
  dataLabels: { enabled: false },
  stroke: { width: 3 },
  fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0 } },
  xaxis: {
    categories: ["100K tokens", "1M tokens", "10M tokens", "100M tokens"],
    labels: { style: { colors: "#9ca3af" } },
  },
  yaxis: { labels: { style: { colors: "#9ca3af" }, formatter: money } },
  legend: { labels: { colors: "#d5d5d5" } },
  grid: { borderColor: "#333" },
  tooltip: { theme: "dark" },
});
chart.render();

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    element("llm-storage").textContent =
      "Could not save to browser storage. Watches and notices will last only for this visit.";
  }
}
function render() {
  const inputTokens = Number(input.value);
  const outputTokens = Number(output.value);
  const sorted = [...state.prices].sort(
    (a, b) =>
      monthlyCost(a, inputTokens, outputTokens) -
      monthlyCost(b, inputTokens, outputTokens),
  );
  const cheapest = sorted[0];
  const inputPrice = Math.min(...state.prices.map((p) => p.input));
  const outputPrice = Math.min(...state.prices.map((p) => p.output));
  element("llm-cheapest").textContent =
    `Cheapest monthly estimate: ${model(cheapest.id).name} — ${money(monthlyCost(cheapest, inputTokens, outputTokens))}. Lowest input: ${money(inputPrice)} / 1M. Lowest output: ${money(outputPrice)} / 1M.`;
  element("llm-updated").textContent =
    `Last successful price check: ${new Date(state.checkedAt).toLocaleString()}`;
  element("llm-rows").innerHTML = sorted
    .map((price) => {
      const provider = model(price.id);
      return `<tr class="bg-card border-b border-border">
      <th scope="row" class="py-4 px-4 font-medium text-left"><span style="color:${provider.color}">${provider.provider}</span><span class="block text-xs text-muted-foreground mt-1">${provider.name}</span></th>
      <td class="py-4 px-4 text-center">${money(price.input)}${price.input === inputPrice ? '<span class="block text-xs text-primary">Cheapest input</span>' : ""}</td>
      <td class="py-4 px-4 text-center">${money(price.output)}${price.output === outputPrice ? '<span class="block text-xs text-primary">Cheapest output</span>' : ""}</td>
      <td class="py-4 px-4 text-center">${money(monthlyCost(price, inputTokens, outputTokens))}</td>
      <td class="py-4 px-4 text-center"><input type="checkbox" class="checkbox checkbox-primary" aria-label="Watch ${provider.name}" data-model="${price.id}" ${state.watched.includes(price.id) ? "checked" : ""}></td>
    </tr>`;
    })
    .join("");
  const notices = element("llm-notices");
  notices.replaceChildren();
  if (!state.notices.length) {
    const empty = document.createElement("li");
    empty.className = "text-sm text-muted-foreground";
    empty.textContent = `No price drops recorded. Watching ${state.watched.length} models.`;
    notices.append(empty);
  }
  for (const notice of state.notices) {
    const item = document.createElement("li");
    item.className = "border border-primary rounded-lg p-3 text-sm";
    item.textContent = `${model(notice.id).name} price dropped: input ${money(notice.before.input)} → ${money(notice.after.input)}, output ${money(notice.before.output)} → ${money(notice.after.output)} per 1M tokens. Checked ${new Date(notice.checkedAt).toLocaleString()}.`;
    notices.append(item);
  }
  clear.disabled = state.notices.length === 0;
}
function renderUsage() {
  if (
    !input.value ||
    !output.value ||
    !input.checkValidity() ||
    !output.checkValidity()
  ) {
    status.textContent = "Enter token counts from 0 to 1,000,000,000,000.";
    return;
  }
  status.textContent = "";
  render();
}
async function checkPrices() {
  if (refresh.disabled) return;
  refresh.disabled = true;
  status.textContent = "Checking public prices…";
  try {
    const response = await fetch(PRICE_SOURCE, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("Price source unavailable");
    const prices = parsePrices(await response.json());
    state = recordPrices(state, prices, new Date().toISOString());
    save();
    status.textContent =
      "Prices checked. Any watched price drops appear below.";
    if (
      input.checkValidity() &&
      output.checkValidity() &&
      input.value &&
      output.value
    )
      render();
    chart.updateSeries(chartSeries());
  } catch {
    status.textContent =
      "Could not refresh prices. Showing the last successful snapshot; try again shortly.";
  } finally {
    refresh.disabled = false;
  }
}
input.addEventListener("input", renderUsage);
output.addEventListener("input", renderUsage);
refresh.addEventListener("click", checkPrices);
element("llm-rows").addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement;
  const id = target.dataset.model;
  if (!id) return;
  state.watched = target.checked
    ? [...new Set([...state.watched, id])]
    : state.watched.filter((watched) => watched !== id);
  save();
  render();
});
clear.addEventListener("click", () => {
  state.notices = [];
  save();
  render();
});
render();
checkPrices();
setInterval(checkPrices, 15 * 60 * 1000);
