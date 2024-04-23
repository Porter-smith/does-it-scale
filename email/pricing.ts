// THIS IS PRICING:
// resend:

import type { PricingBreakdown } from "../shared/types";


// Up to 0-3,000 emails for free

// 3,000-59,999 emails is $20

// 60,000- 109,999 emails is $35

// 110,000 - 159,999 emails is $50

// 160,000- 299,999 emails is $80

// 300,000- 699,999 emails is $200

// 300,000- 699,999 emails is $200

// 700,000 - 1,399,999 emails is $400

// 1,400,000 - 2,399,999 emails is $700

// 2,400,000 - 3,999,999 emails is $900

// 4,000,000 - 5,000,000 emails is $1,200




// When pricing updates change we will need to update these functions. If this site succeeds I plan on site to have a system where someone can easily create github issue with updated pricing or something?
// Ideally though these price changes shouldn't happen too often but I will do my best to keep this update to date.
// TODO: Maybe have auth pricing and email pricing just use same keys for consistency 
export interface EmailPricing {
    service: string;
    iconName: string;
    emails5k: number;
    emails10k: number;
    emails50k: number;
    emails100k: number;
    emails1m: number;
    emails2m: number;
    color: string;
    pricingPage: string;
  }


// SendGrid 
// https://docs.sendgrid.com/ui/account-and-settings/billing#api-plans-overage-costs

interface SendGridPlan {
  limit: number;
  basePrice: number;
  overagePerEmail: number;
  name: string;
}
const sendGridPlans: SendGridPlan[] = [
  { name: "Essentials 50K", limit: 50000, basePrice: 19.95, overagePerEmail: 0.00133 },
  { name: "Essentials 100K", limit: 100000, basePrice: 34.95, overagePerEmail: 0.00088 },
  { name: "Pro 100K", limit: 100000, basePrice: 89.95, overagePerEmail: 0.00110 },
  { name: "Pro 300K", limit: 300000, basePrice: 249, overagePerEmail: 0.00091 },
  { name: "Pro 700K", limit: 1000000, basePrice: 499, overagePerEmail: 0.00078 },
  { name: "Pro 1.5M", limit: 2000000, basePrice: 799, overagePerEmail: 0.00059 },
  { name: "Pro 2.5M", limit: 2500000, basePrice: 1999, overagePerEmail: 0.00047 }
];


// Function to find the most cost-effective SendGrid plan for a given number of emails
export function findBestSendGridPlan(emailCount: number): { plan: string, totalCost: number } {
  let cheapestPlan: SendGridPlan | null = null;
  let lowestCost = Infinity;

  sendGridPlans.forEach(plan => {
    let cost = plan.basePrice + (emailCount > plan.limit ? (emailCount - plan.limit) * plan.overagePerEmail : 0);

    if (cost < lowestCost) {
      lowestCost = cost;
      cheapestPlan = plan;
    }
  });

  if (cheapestPlan === null) {
    throw new Error("No suitable plan found for the given email count.");
  }

  return {
    plan: (cheapestPlan as SendGridPlan).name,
    totalCost: lowestCost
  };
}







// There pricing is a bit confusing but they have plan but also charge for each email if you go over the limit


// Function to calculate costs dynamically based on the best plan for given email volume
export function calculateDynamicSendGridCost(emails: number) {
  const bestPlan = findBestSendGridPlan(emails);
  return {
    planUsed: bestPlan.plan,
    totalCost: bestPlan.totalCost,
    emailCount: emails
  };
}







// Using information from https://aws.amazon.com/ses/pricing/
// Updated: 4/22/24
// Define the pricing tier for AWS SES
const awsSesPricing = {
  pricePerEmail: 0.0001,  // $0.0001 per email is $0.10 for every 1,000 emails
  dataPricePerKB: 0.00000032,  // $0.12 per GB, converted to KB
  freeEmailsPerMonth: 3000  // Number of free emails provided each month
};

// Function to calculate the cost of sending emails with AWS SES, including data costs.
export function calculateAwsSesCost(emailCount: number, averageEmailSizeKB: number) {
  let emailCost = (emailCount > awsSesPricing.freeEmailsPerMonth) 
                  ? (emailCount - awsSesPricing.freeEmailsPerMonth) * awsSesPricing.pricePerEmail 
                  : 0;
  let dataCost = emailCount * averageEmailSizeKB * awsSesPricing.dataPricePerKB;

  return emailCost + dataCost;
}


  // Using information from https://resend.com/pricing?product=transactional
  // Updated: 4/21/24
  const resendPricingTiers = [
    { limit: 3000, price: 0 },
    { limit: 59999, price: 20 },
    { limit: 109999, price: 35 },
    { limit: 159999, price: 50 },
    { limit: 299999, price: 80 },
    { limit: 699999, price: 200 },
    { limit: 1399999, price: 400 },
    { limit: 2399999, price: 700 },
    { limit: 3999999, price: 900 },
    { limit: 5000000, price: 1200 },
  ];
  
  export function calculateResendCost(emails: number): number {
    const tier = resendPricingTiers.find((tier) => emails <= tier.limit);
    if (!tier) {
      throw new Error("No pricing tier found for the given number of emails");
    }
    return tier.price;
  }  
  
  
// Estimate cost for a typical "verify password" email that's around 10KB in size
  export const averageEmailSizeKB = 20;
  export const emailPrices: EmailPricing[] = [
    {
      service: "Resend",
      iconName: "resend",
      emails5k: calculateResendCost(5000),
      emails10k: calculateResendCost(10000),
      emails50k: calculateResendCost(50000),
      emails100k: calculateResendCost(100000),
      emails1m: calculateResendCost(1000000),
      emails2m: calculateResendCost(2000000),
      color: "#4f46e5",
      pricingPage: "https://resend.com/pricing?product=transactional",
    },
    {
      service: "AWS SES",
      iconName: "aws",
      // For AWS we will just calculate simple sending a small file size. Later we can add ability to change and fine tune this for more accurate pricing for now we will just do a simple calulation
      emails5k: calculateAwsSesCost(5000, averageEmailSizeKB),
      emails10k: calculateAwsSesCost(10000, averageEmailSizeKB),
      emails50k: calculateAwsSesCost(50000, averageEmailSizeKB),
      emails100k: calculateAwsSesCost(100000, averageEmailSizeKB),
      emails1m: calculateAwsSesCost(1000000, averageEmailSizeKB),
      emails2m: calculateAwsSesCost(2000000, averageEmailSizeKB),
      color: "#FF9900",
      pricingPage: "https://aws.amazon.com/ses/pricing/",
    },
    // TODO: For SendGrid we should add the other plans since it will be cheaper then 
    {
      service: "SendGrid",
      iconName: "sendgrid",
      emails5k: findBestSendGridPlan(5000).totalCost,
      emails10k: findBestSendGridPlan(10000).totalCost,
      emails50k: findBestSendGridPlan(50000).totalCost,
      emails100k: findBestSendGridPlan(100000).totalCost,
      emails1m: findBestSendGridPlan(1000000).totalCost,
      emails2m: findBestSendGridPlan(2000000).totalCost,
      color: "#1A82e2",
      pricingPage: "https://sendgrid.com/en-us/pricing"
    }
    // Add other email services here as needed
  ];

  
  // TODO: Have Breakdowns maybe from how they are calulated from the functions so if we change that it also changes that too?
  export const emailPricingBreakdown: PricingBreakdown  = {
    Resend: [
      "Free for up to 3,000 emails a month you get a daily limit of 100 emails a day",
      "Tier based pricing:",
      "$20 for 5,000-59,999 emails",
      "$35 for 60,000-109,999 emails",
      "$50 for 110,000-159,999 emails",
      "$80 for 160,000-299,999 emails",
      "$200 for 300,000-699,999 emails",
      "$400 for 700,000-1,399,999 emails",
      "$700 for 1,400,000-2,399,999 emails",
      "$900 for 2,400,000-3,999,999 emails",
      "$1,200 for 4,000,000-5,000,000 emails",
      "Contact for Enterprise Pricing for 5,000,000+ emails",
    ],
    'AWS SES': [
      `First 3,000 emails per month are free. Afterwards, you pay $0.10 for every 1,000 emails sent or received. Additionally, data transfer is charged at $0.12 per GB. In this breakdown we assume each email sent is ${averageEmailSizeKB}KB. `
    ],
    'SendGrid': [
      "Essentials 50K: $19.95/mo for up to 50,000 emails, $0.00133 per email over.",
      "Essentials 100K: $34.95/mo for up to 100,000 emails, $0.00088 per email over.",
      "Pro 100K: $89.95/mo for up to 100,000 emails, $0.00110 per email over.",
      "Pro 300K: $249/mo for up to 300,000 emails, $0.00091 per email over.",
      "Pro 700K: $499/mo for up to 700,000 emails, $0.00078 per email over.",
      "Pro 1.5M: $799/mo for up to 1.5 million emails, $0.00059 per email over.",
      "Pro 2.5M: $1,999/mo for up to 2.5 million emails, $0.00047 per email over.",
      `5,000 emails: ${findBestSendGridPlan(5000).plan} at $${findBestSendGridPlan(5000).totalCost.toFixed(2)}`,
      `10,000 emails: ${findBestSendGridPlan(10000).plan} at $${findBestSendGridPlan(10000).totalCost.toFixed(2)}`,
      `50,000 emails: ${findBestSendGridPlan(50000).plan} at $${findBestSendGridPlan(50000).totalCost.toFixed(2)}`,
      `100,000 emails: ${findBestSendGridPlan(100000).plan} at $${findBestSendGridPlan(100000).totalCost.toFixed(2)}`,
      `1,000,000 emails: ${findBestSendGridPlan(1000000).plan} at $${findBestSendGridPlan(1000000).totalCost.toFixed(2)}`,
      `2,000,000 emails: ${findBestSendGridPlan(2000000).plan} at $${findBestSendGridPlan(2000000).totalCost.toFixed(2)}`
    ]
    // Add other email services here as needed
  };
  
  // NOTE: I need to double-check Resend's pricing tiers because I'm not sure exactly when the tiers end and begin. For example, I believe 4,000 emails cost the same as 50,000 emails ($20). Can you please confirm if this understanding is correct?


  
// Helper function to map our data so our graph library can use it
export function extractSeriesData(prices: EmailPricing[]) {
  return prices.map((service) => {
      return {
          name: service.service,
          data: [
              service.emails5k,
              service.emails10k,
              service.emails50k,
              service.emails100k,
              service.emails1m,
              service.emails2m,
          ],
          color: service.color,
      };
  });
}