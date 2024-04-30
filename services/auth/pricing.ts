// When pricing updates change we will need to update these functions. If this site succeeds I plan on site to have a system where someone can easily create github issue with updated pricing or something?
// Ideally though these price changes shouldn't happen too often but I will do my best to keep this update to date.
 
import type { PricingBreakdown } from "../shared/types";


export interface ServicePrice {
    service: string;
    iconName: string;
    users5k: number;
    users10k: number;
    users50k: number;
    users100k: number;
    users1m: number;
    users2m: number;
    color: string;
    pricingPage: string; // Add this line
  }
    // TODO: Add Kinde Provider 
    // Using information from
    // https://auth0.com/pricing
    // Updated: 4/21/24
  
    // Auth0 pricing is currently really confusing at the time of writing this
    // Auth0 has many different plans and most of them don't provide linear based pricing like the other authenication providers
    // Only one of there plan's in linear based pricing according which I was able to find about from this
    // from auth0 employee confirming how B2C - essentials plan is $0.07 per MAU a month scaling linarly in the comments on a blog post they had (https://auth0.com/blog/upcoming-pricing-changes-for-the-customer-identity-cloud/)
    // for the other plans like B2C - Pro and B2B - Essentials it seems these are tiered and I can't find any documentation for it if anyone has any insights just let me know an I'll add it
    
    // Here is information I am have right now from pricing page
    // B2C - Essentials:
    // $0.07 per MAU a month (confirmed by tlo (auth0 employee) here in comments: https://auth0.com/blog/upcoming-pricing-changes-for-the-customer-identity-cloud/)
    
    // B2C - Professional:
    // 500-1,000 MAU: $0.24 per MAU per month
    // 1,001-2,500 MAU: $0.218 per MAU per month
    // 2,501-5,000 MAU: $0.20 per MAU per month
    // 5,001-7,500 MAU: $0.16 per MAU per month
    // 7,501-10,000 MAU: $0.16 per MAU per month
    
    // B2B plan - Essentials:
  
    // From 500 to 1,000 users, the cost per user is $0.30 per month.
    // From 1,001 to 2,500 users, the cost per user is $0.28 per month.
    // From 2,501 to 5,000 users, the cost per user is $0.26 per month.
    // From 5,001 to 7,500 users, the cost per user is $0.23 per month.
    
    // B2B plan - Professional:
    // Unknown Pricing doesn't say on pricing page
    
    // There is also secret menu pricing plans like startup, and nonprofit
    // Both of these plans don't say how much they cost on the site 
    
    // https://auth0.com/nonprofits
    
    // https://auth0.com/startups
    
    
    function calculateAuth0CostB2CEssentials(users: number): number {
      const freeLimit = 7500; // Free for up to 7,500 MAUs
      const ratePerUser = 0.07; // $0.07 per MAU
    
      let cost = 0;
    
      if (users > freeLimit) {
        cost = Math.floor(users * ratePerUser); // Cost for all users, rounded down to the nearest whole number
      }
    
      return cost;
    }
    
    // TODO: We can add other Auth0 Plans here too but information isn't complete since it isn't provided on the website if someone has information for it though just create a pull request or github issue and i'll add it.
    
    // Using information from https://clerk.com/pricing
    // Updated: 4/21/24
    function calculateClerkAuthCost(users: number): number {
      const freeLimit = 10000; // Free for up to 10,000 MAUs
      const baseCostProPlan = 25; // $25 base fee for the Pro plan
      const rateAbove10k = 0.02; // $0.02 per MAU beyond 10,000
    
      let cost = 0;
      if (users > freeLimit) {
        cost += baseCostProPlan + (users - freeLimit) * rateAbove10k; // Add base cost plus cost per user above 10,000
      }
    
      return cost;
    }
    
    // Using information from https://supabase.com/pricing
    // Updated: 4/21/24
    export function calculateSupabaseAuthCost(users: number): number {
      let cost = 0;
      const baseCost50kTo100k = 25; // $25 per month for 50,000 to 100,000 users
      const rateAbove100k = 0.00325; // $0.00325 per MAU beyond 100,000
    
      if (users > 100000) {
        cost += (users - 100000) * rateAbove100k;
        users = 100000;
      }
      if (users > 50000) {
        cost += baseCost50kTo100k;
      }
    
      return cost;
    }
    
    // Using information from https://cloud.google.com/identity-platform/pricing
    // Testing tool by google https://cloud.google.com/products/calculator-legacy/#id=1d75d662-b70c-4356-9f2a-be8193450fb8
    // Updated: 4/21/24
    
    export function calculateFirebaseAuthCost(users: number): number {
      let cost = 0;
      const rate50kTo100k = 0.0055;
      const rate100kTo1m = 0.0046;
      const rate1mTo10m = 0.0032;
      const rateAbove10m = 0.0025;
    
      if (users > 10000000) {
        cost += (users - 10000000) * rateAbove10m;
        users = 10000000;
      }
      if (users > 1000000) {
        cost += (users - 1000000) * rate1mTo10m;
        users = 1000000;
      }
      if (users > 100000) {
        cost += (users - 100000) * rate100kTo1m;
        users = 100000;
      }
      if (users > 50000) {
        cost += (users - 50000) * rate50kTo100k;
      }
    
      return cost;
    }


 
// https://fusionauth.io/pricing?step=plan&hosting=basic-cloud
// Updated: 4/30/24
export function calculateFusionAuthCommunityCost(users: number): number {
  const basicHostingCost = 37; // $37 per month for Basic hosting
  return basicHostingCost;
}

// https://fusionauth.io/pricing?step=plan&hosting=basic-cloud
// Updated: 4/30/24
export function calculateFusionAuthEssentialsCost(users: number): number {
  const freeLimit = 10000; // Free for up to 10,000 MAUs
  const baseCost = 850; // $850 base fee per month
  const rate10kTo100k = 175; // $175 per additional 10,000 MAUs up to 100,000
  const rate100kTo1m = 100; // $100 per additional 10,000 MAUs up to 1,000,000
  const rateAbove1m = 20; // $20 per additional 10,000 MAUs beyond 1,000,000
  const basicHostingCost = 37; // $37 per month for Basic hosting

  let cost = baseCost;
  let mauPrice = 0;

  if (users > freeLimit) {
    const s = (users - freeLimit) / 10000;

    if (s <= 9) {
      mauPrice = rate10kTo100k * s;
    } else if (s <= 99) {
      mauPrice = 9 * rate10kTo100k + rate100kTo1m * (s - 9);
    } else {
      mauPrice = 9 * rate10kTo100k + 90 * rate100kTo1m + rateAbove1m * (s - 99);
    }
  }

  cost += mauPrice;
  cost += basicHostingCost;

  return cost;
}
    export const prices: ServicePrice[] = [
      {
        service: "Firebase Auth",
        iconName: "firebase",
        users5k: calculateFirebaseAuthCost(5000),
        users10k: calculateFirebaseAuthCost(10000),
        users50k: calculateFirebaseAuthCost(50000),
        users100k: calculateFirebaseAuthCost(100000),
        users1m: calculateFirebaseAuthCost(1000000),
        users2m: calculateFirebaseAuthCost(2000000),
        color: "#ffca28",
        pricingPage: "https://cloud.google.com/identity-platform/pricing", // Add this line
      },
      {
        service: "Supabase Auth",
        iconName: "supabase",
        users5k: calculateSupabaseAuthCost(5000),
        users10k: calculateSupabaseAuthCost(10000),
        users50k: calculateSupabaseAuthCost(50000),
        users100k: calculateSupabaseAuthCost(100000),
        users1m: calculateSupabaseAuthCost(1000000),
        users2m: calculateSupabaseAuthCost(2000000),
        color: "#2fad75",
        pricingPage: "https://supabase.com/pricing", // Add this line
      },
      {
        service: "Clerk",
        iconName: "clerk",
        users5k: calculateClerkAuthCost(5000),
        users10k: calculateClerkAuthCost(10000),
        users50k: calculateClerkAuthCost(50000),
        users100k: calculateClerkAuthCost(100000),
        users1m: calculateClerkAuthCost(1000000),
        users2m: calculateClerkAuthCost(2000000),
        color: "#3657cf",
        pricingPage: "https://clerk.com/pricing", // Add this line
      },
      {
        service: "Auth0",
        iconName: "auth0",
        users5k: calculateAuth0CostB2CEssentials(5000),
        users10k: calculateAuth0CostB2CEssentials(10000),
        users50k: calculateAuth0CostB2CEssentials(50000),
        users100k: calculateAuth0CostB2CEssentials(100000),
        users1m: calculateAuth0CostB2CEssentials(1000000),
        users2m: calculateAuth0CostB2CEssentials(2000000),
        color: "#272727",
        pricingPage: "https://auth0.com/pricing", // Add this line
      },
      {
        service: "FusionAuth Community",
        iconName: "fusionauth",
        users5k: calculateFusionAuthCommunityCost(5000),
        users10k: calculateFusionAuthCommunityCost(10000),
        users50k: calculateFusionAuthCommunityCost(50000),
        users100k: calculateFusionAuthCommunityCost(100000),
        users1m: calculateFusionAuthCommunityCost(1000000),
        users2m: calculateFusionAuthCommunityCost(2000000),
        color: "#f58320",
        pricingPage: "https://fusionauth.io/pricing?step=plan&hosting=basic-cloud",
      },
      {
        service: "FusionAuth Essentials",
        iconName: "fusionauth",
        users5k: calculateFusionAuthEssentialsCost(5000),
        users10k: calculateFusionAuthEssentialsCost(10000),
        users50k: calculateFusionAuthEssentialsCost(50000),
        users100k: calculateFusionAuthEssentialsCost(100000),
        users1m: calculateFusionAuthEssentialsCost(1000000),
        users2m: calculateFusionAuthEssentialsCost(2000000),
        color: "#0ea5e9",
        pricingPage: "https://fusionauth.io/pricing?step=plan&hosting=basic-cloud",
      },
      
      
      // Add other services here as previously defined
    ];
    // TODO: Have it use the values from variables so don't have to update it each time

    export const pricingBreakdown: PricingBreakdown = {
      "Firebase Auth": [
        "Free for up to 50,000 MAUs",
        "$0.0055 per MAU for 50,000 to 100,000 users",
        "$0.0046 per MAU for 100,000 to 1,000,000 users",
        "$0.0032 per MAU for 1,000,000 to 10,000,000 users",
        "$0.0025 per MAU beyond 10,000,000 users",
      ],
      "Supabase Auth": [
        "Free for up to 50,000 MAUs",
        "$25 per month for 50,000 to 100,000 users",
        "$0.00325 per MAU beyond 100,000 users",
      ],
      Clerk: [
        "Free for up to 10,000 MAUs",
        "$25 base fee for the Pro plan",
        "$0.02 per MAU beyond 10,000 users",
      ],
      Auth0: [
        "Free for up to 7,500 MAUs",
        "$0.07 per MAU beyond 7,500 users (B2C Essentials plan)",
      ],
      "FusionAuth Community": [
        "$37 a month for FusionAuth Basic hosting (self hosting is also an option)",
        "Community Edition is free for unlimited MAUs",
      ],
      "FusionAuth Essentials": [
        "Free for up to 10,000 MAUs",
        "$850 base fee per month",
        "$175 per additional 10,000 MAUs up to 100,000",
        "$100 per additional 10,000 MAUs up to 1,000,000",
        "$20 per additional 10,000 MAUs beyond 1,000,000",
        "Hosting is an additional cost (e.g., $37/month for FusionAuth Basic hosting), self-hosting is also an option",
      ],
      // Add other services here as needed
    };
  
    // Graph Map helper:
  
    export function extractSeriesData(prices: ServicePrice[]) {
      return prices.map((service) => {
        return {
          name: service.service,
          data: [
            service.users5k,
            service.users10k,
            service.users50k,
            service.users100k,
            service.users1m,
            service.users2m,
          ],
          color: service.color,
        };
      });
    }