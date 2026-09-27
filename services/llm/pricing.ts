export const PRICE_SOURCE = "https://openrouter.ai/api/v1/models";
export const providers = [
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    color: "#10a37f",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    color: "#d97757",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    color: "#4285f4",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek V3 0324",
    provider: "DeepSeek",
    color: "#8b8eff",
  },
  {
    id: "mistralai/mistral-nemo",
    name: "Mistral Nemo",
    provider: "Mistral",
    color: "#ffca28",
  },
  {
    id: "qwen/qwen3-32b",
    name: "Qwen3 32B",
    provider: "Qwen",
    color: "#c084fc",
  },
];
export interface TokenPrice {
  id: string;
  input: number;
  output: number;
}
export interface PriceNotice {
  id: string;
  before: TokenPrice;
  after: TokenPrice;
  checkedAt: string;
}
export interface PriceState {
  prices: TokenPrice[];
  checkedAt: string;
  watched: string[];
  notices: PriceNotice[];
}
export function validPrice(value: unknown): value is TokenPrice {
  if (!value || typeof value !== "object") return false;
  const p = value as TokenPrice;
  return (
    providers.some((provider) => provider.id === p.id) &&
    typeof p.input === "number" &&
    Number.isFinite(p.input) &&
    p.input >= 0 &&
    typeof p.output === "number" &&
    Number.isFinite(p.output) &&
    p.output >= 0
  );
}
export function parsePrices(payload: unknown): TokenPrice[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as { data?: unknown }).data)
  ) {
    throw new Error("Invalid price response");
  }
  const data = (
    payload as {
      data: {
        id: string;
        pricing?: { prompt?: string; completion?: string };
      }[];
    }
  ).data;
  return providers.map((provider) => {
    const model = data.find((model) => model?.id === provider.id);
    const prompt = model?.pricing?.prompt;
    const completion = model?.pricing?.completion;
    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      typeof completion !== "string" ||
      !completion.trim()
    ) {
      throw new Error("Incomplete price response");
    }
    const price = {
      id: provider.id,
      input: Number(prompt) * 1e6,
      output: Number(completion) * 1e6,
    };
    if (!validPrice(price)) throw new Error("Invalid token rate");
    return price;
  });
}
export function monthlyCost(
  price: TokenPrice,
  input: number,
  output: number,
): number {
  return (price.input * input + price.output * output) / 1e6;
}
export function recordPrices(
  state: PriceState,
  prices: TokenPrice[],
  checkedAt: string,
): PriceState {
  const notices = prices.flatMap((after) => {
    const before = state.prices.find((price) => price.id === after.id);
    return before &&
      state.watched.includes(after.id) &&
      (after.input < before.input || after.output < before.output)
      ? [{ id: after.id, before, after, checkedAt }]
      : [];
  });
  return {
    ...state,
    prices,
    checkedAt,
    notices: [...notices, ...state.notices].slice(0, 50),
  };
}
export function restoreState(
  raw: string | null,
  fallback: PriceState,
): PriceState {
  if (!raw) return fallback;
  try {
    const state = JSON.parse(raw) as PriceState;
    if (
      !Array.isArray(state.prices) ||
      state.prices.length !== providers.length ||
      new Set(state.prices.map((p) => p.id)).size !== providers.length ||
      !state.prices.every(validPrice) ||
      !Number.isFinite(Date.parse(state.checkedAt)) ||
      !Array.isArray(state.watched) ||
      !state.watched.every((id) => providers.some((p) => p.id === id)) ||
      !Array.isArray(state.notices) ||
      !state.notices.every(
        (n) =>
          n &&
          validPrice(n.before) &&
          validPrice(n.after) &&
          n.id === n.after.id &&
          n.id === n.before.id &&
          Number.isFinite(Date.parse(n.checkedAt)),
      )
    )
      return fallback;
    return { ...state, notices: state.notices.slice(0, 50) };
  } catch {
    return fallback;
  }
}
