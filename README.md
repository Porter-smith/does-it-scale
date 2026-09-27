
<p align="center">
  <img alt="Does it scale logo with text saying build what you want without the unknowns" src="./.github/assets/preview.png">
</p>

<h1 align="center">Welcome to DoesItScale.dev</h1>

<p align="center">
  <strong><a href="https://doesitscale.dev/">Try me!</a></strong>
</p>

<p align="center">
  <strong>DoesItScale.dev</strong> helps you compare pricing for different developer tools so you can build what you want without the unknowns. Our algorithms for pricing comparison are open sourced in this repository, allowing you to see how we calculate and compare costs across different services.
</p>

## About This Repository

This repository contains:

- **Open Source Pricing Algorithms**: These are available for community use and contributions. If you spot an issue or an outdated pricing model, please submit a pull request or open an issue.
- **Local Test UI**: A UI that displays the data for these algorithms, designed for local testing and development.

## Contribution Guide

We welcome contributions of all kinds from the community:

- **Update Pricing**: If you have more current pricing information, please submit a pull request with the updated data.
- **Add New Services**: Help us expand our comparisons by adding new services to the algorithms.

### Adding a New Auth Provider

To add a new auth provider:

1. Open the `services/auth/pricing.ts` file.
2. Create a new function to calculate the cost for the auth provider, e.g., `calculateNewAuthCost`.
3. Implement the pricing logic based on the provider's pricing model.
4. Add a new entry to the `prices` array with the service name, icon, pricing data, color, and pricing page URL.
5. Add a new entry to the `pricingBreakdown` object with the pricing details for the new provider.
6. Add the icon to the `src/icons` you specifed in the prices array 
6. Submit a pull request with your changes.

Example:
```typescript
// Add the new auth provider pricing function
export function calculateNewAuthCost(users: number): number {
  // Implement the pricing logic for the new auth provider
  // ...
}

export const prices: ServicePrice[] = [
  // ...
  {
    service: "New Auth",
    iconName: "newauth",
    users5k: calculateNewAuthCost(5000),
    users10k: calculateNewAuthCost(10000),
    users50k: calculateNewAuthCost(50000),
    users100k: calculateNewAuthCost(100000),
    users1m: calculateNewAuthCost(1000000),
    users2m: calculateNewAuthCost(2000000),
    color: "#ff0000",
    pricingPage: "https://newauth.com/pricing",
  },
  // ...
];

export const pricingBreakdown: PricingBreakdown = {
  // ...
  "New Auth": [
    "Pricing details for New Auth",
    // ...
  ],
  // ...
};
```

### Updating an Auth Provider

To update an existing auth provider:

1. Open the `services/auth/pricing.ts` file.
2. Locate the function that calculates the cost for the auth provider you want to update, e.g., `calculateFirebaseAuthCost`.
3. Update the pricing logic and rates according to the latest information.
4. Update the corresponding entry in the `pricingBreakdown` object with the new pricing details.
5. Submit a pull request with your changes.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Porter-smith/does-it-scale.git
   ```
2. Install dependencies:
   ```bash
   cd doesitscale.dev
   pnpm install
   ```
3. Run the project locally:
   ```bash
   pnpm dev
   ```

## More Information

Please note that while the pricing and authentication algorithms are open source, the frontend code is maintained separately and is not open sourced.

## LLM token comparison

The local test UI also compares six LLM providers using the public OpenRouter model catalog. Rates are OpenRouter USD per million input/output tokens, not direct-provider quotes. The existing email and authentication comparisons remain available.

Use Node 22 and pnpm 8 (the lockfile uses version 6). Run `pnpm install`, `pnpm test`, and `pnpm build`. For this task's preview, run `pnpm dev --host 0.0.0.0 --port 4329` and open `http://localhost:4329/#llm`.

- `services/llm/pricing.ts` defines the compared models, rate conversion, and drop detection.
- `pnpm prices:update` updates the committed public fallback snapshot. It requires no API key.
- The browser refreshes rates on each visit, on demand, and every 15 minutes while open. Failed or incomplete responses retain the last successful snapshot and show a notice.
- All six models are watched initially. Watches, the last successful prices, and up to 50 drop notices persist in this browser's local storage. Uncheck a model to stop watching it. Clear notices removes notices without resetting the price baseline.
- Monitoring is browser-local: no background worker, server notification service, or phone push is configured. Storage failures leave session-only notices and show a message.
- Cheapest input and output rates are highlighted separately. The monthly estimate uses the entered usage; the chart compares total token volume at an explicit 4:1 input/output ratio. Quality, caching, batch pricing, non-token fees, and context tiers are outside this comparison.

Browser regression tests: `PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/playwright pnpm exec playwright install chromium`, then `PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/playwright pnpm test:browser`. These use local pages and controlled pricing responses to verify clicks, watch persistence, a simulated price drop, deduplication, source failure, and storage failure. No test notices are written to a user's browser.
