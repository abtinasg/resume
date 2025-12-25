/**
 * Layer 1 - Evaluation Engine
 * Companies Configuration
 *
 * Contains company to industry mappings for 100+ major companies
 * to help infer industry experience from resume content.
 */

// ==================== Company Industry Map ====================

/**
 * Map of well-known companies to their primary industry
 * Includes FAANG, unicorns, major enterprises, and notable startups
 */
export const COMPANY_INDUSTRY_MAP: Record<string, string> = {
  // FAANG / Big Tech
  Google: 'software',
  Alphabet: 'software',
  Apple: 'software',
  Amazon: 'ecommerce',
  'Amazon Web Services': 'software',
  AWS: 'software',
  Meta: 'software',
  Facebook: 'software',
  Netflix: 'entertainment',
  Microsoft: 'software',

  // Other Big Tech
  IBM: 'software',
  Oracle: 'software',
  Salesforce: 'software',
  Adobe: 'software',
  Cisco: 'telecom',
  Intel: 'manufacturing',
  NVIDIA: 'software',
  AMD: 'manufacturing',
  Qualcomm: 'telecom',
  VMware: 'software',
  Broadcom: 'manufacturing',
  SAP: 'software',
  ServiceNow: 'software',
  Workday: 'software',
  Intuit: 'fintech',
  Atlassian: 'software',
  Zoom: 'software',
  Snowflake: 'software',
  Databricks: 'software',
  Palantir: 'software',
  Splunk: 'software',
  Elastic: 'software',

  // Unicorns & High-Growth Tech
  Stripe: 'fintech',
  Airbnb: 'travel',
  Uber: 'transportation',
  Lyft: 'transportation',
  DoorDash: 'foodtech',
  Instacart: 'ecommerce',
  Robinhood: 'fintech',
  Coinbase: 'web3',
  SpaceX: 'transportation',
  OpenAI: 'ai_ml',
  Anthropic: 'ai_ml',
  Figma: 'software',
  Notion: 'software',
  Canva: 'software',
  Discord: 'entertainment',
  Slack: 'software',
  Dropbox: 'software',
  Box: 'software',
  Twilio: 'telecom',
  SendGrid: 'software',
  Plaid: 'fintech',
  Ramp: 'fintech',
  Brex: 'fintech',
  Chime: 'fintech',
  SoFi: 'fintech',
  Affirm: 'fintech',
  Klarna: 'fintech',
  Square: 'fintech',
  Block: 'fintech',
  PayPal: 'fintech',
  Venmo: 'fintech',
  Rippling: 'hr_tech',
  Gusto: 'hr_tech',
  Lattice: 'hr_tech',
  GitLab: 'software',
  GitHub: 'software',
  Vercel: 'software',
  Netlify: 'software',
  Heroku: 'software',
  DigitalOcean: 'software',
  Cloudflare: 'software',
  Hashicorp: 'software',
  MongoDB: 'software',
  Redis: 'software',
  Confluent: 'software',
  Datadog: 'software',
  PagerDuty: 'software',
  Sentry: 'software',
  LaunchDarkly: 'software',
  Auth0: 'cybersecurity',
  Okta: 'cybersecurity',
  CrowdStrike: 'cybersecurity',
  Palo Alto Networks: 'cybersecurity',
  Zscaler: 'cybersecurity',
  SentinelOne: 'cybersecurity',
  Tanium: 'cybersecurity',

  // E-commerce & Consumer
  Shopify: 'ecommerce',
  Etsy: 'ecommerce',
  eBay: 'ecommerce',
  Wayfair: 'ecommerce',
  Chewy: 'ecommerce',
  'Warby Parker': 'retail',
  Allbirds: 'retail',
  Peloton: 'retail',
  Casper: 'retail',
  Glossier: 'retail',

  // Social Media & Content
  Twitter: 'software',
  X: 'software',
  LinkedIn: 'software',
  TikTok: 'entertainment',
  ByteDance: 'entertainment',
  Pinterest: 'software',
  Snapchat: 'software',
  Snap: 'software',
  Reddit: 'software',
  Spotify: 'entertainment',
  Twitch: 'entertainment',
  YouTube: 'entertainment',

  // Gaming
  Roblox: 'entertainment',
  'Epic Games': 'entertainment',
  Activision: 'entertainment',
  'Activision Blizzard': 'entertainment',
  'Electronic Arts': 'entertainment',
  EA: 'entertainment',
  Riot: 'entertainment',
  'Riot Games': 'entertainment',
  Unity: 'software',
  'Take-Two': 'entertainment',

  // Finance & Banking
  'JPMorgan Chase': 'finance',
  JPMorgan: 'finance',
  'Goldman Sachs': 'finance',
  'Morgan Stanley': 'finance',
  'Bank of America': 'finance',
  Citigroup: 'finance',
  Citi: 'finance',
  'Wells Fargo': 'finance',
  'Capital One': 'finance',
  'American Express': 'finance',
  Amex: 'finance',
  Visa: 'fintech',
  Mastercard: 'fintech',
  BlackRock: 'finance',
  Fidelity: 'finance',
  Vanguard: 'finance',
  'Charles Schwab': 'finance',
  Bloomberg: 'finance',
  'Two Sigma': 'finance',
  Citadel: 'finance',
  'Jane Street': 'finance',
  'DE Shaw': 'finance',

  // Healthcare & Biotech
  'Johnson & Johnson': 'healthcare',
  'J&J': 'healthcare',
  Pfizer: 'biotech',
  Moderna: 'biotech',
  'UnitedHealth Group': 'healthcare',
  UnitedHealthcare: 'healthcare',
  Anthem: 'insurance',
  Elevance: 'insurance',
  CVS: 'healthcare',
  'CVS Health': 'healthcare',
  Walgreens: 'healthcare',
  Kaiser: 'healthcare',
  'Kaiser Permanente': 'healthcare',
  Humana: 'healthcare',
  Cigna: 'insurance',
  Epic: 'healthcare',
  'Epic Systems': 'healthcare',
  Cerner: 'healthcare',
  Veeva: 'healthcare',
  Tempus: 'biotech',
  '23andMe': 'biotech',
  Illumina: 'biotech',
  Genentech: 'biotech',
  Amgen: 'biotech',
  Gilead: 'biotech',
  Regeneron: 'biotech',
  'Vertex Pharmaceuticals': 'biotech',

  // Consulting
  McKinsey: 'consulting',
  'McKinsey & Company': 'consulting',
  BCG: 'consulting',
  'Boston Consulting Group': 'consulting',
  Bain: 'consulting',
  'Bain & Company': 'consulting',
  Deloitte: 'consulting',
  PwC: 'consulting',
  PricewaterhouseCoopers: 'consulting',
  KPMG: 'consulting',
  EY: 'consulting',
  'Ernst & Young': 'consulting',
  Accenture: 'consulting',

  // Telecom
  'AT&T': 'telecom',
  Verizon: 'telecom',
  'T-Mobile': 'telecom',
  Comcast: 'telecom',
  'Charter Communications': 'telecom',
  Spectrum: 'telecom',

  // Retail & Consumer Goods
  Walmart: 'retail',
  Target: 'retail',
  Costco: 'retail',
  'Home Depot': 'retail',
  "Lowe's": 'retail',
  Nike: 'retail',
  Adidas: 'retail',
  Starbucks: 'foodtech',
  "McDonald's": 'foodtech',
  Chipotle: 'foodtech',
  'Procter & Gamble': 'retail',
  'P&G': 'retail',
  'Unilever': 'retail',
  'Coca-Cola': 'retail',
  PepsiCo: 'retail',
  Nestle: 'retail',

  // Transportation & Logistics
  FedEx: 'logistics',
  UPS: 'logistics',
  DHL: 'logistics',
  'United Airlines': 'transportation',
  Delta: 'transportation',
  'Delta Airlines': 'transportation',
  American: 'transportation',
  'American Airlines': 'transportation',
  Southwest: 'transportation',
  'Southwest Airlines': 'transportation',
  Tesla: 'transportation',
  Ford: 'transportation',
  GM: 'manufacturing',
  'General Motors': 'manufacturing',
  Toyota: 'manufacturing',
  Honda: 'manufacturing',
  BMW: 'manufacturing',
  Volkswagen: 'manufacturing',
  Rivian: 'transportation',
  Lucid: 'transportation',
  Waymo: 'transportation',
  Cruise: 'transportation',
  Aurora: 'transportation',
  Nuro: 'transportation',

  // Energy
  ExxonMobil: 'energy',
  Chevron: 'energy',
  'Shell': 'energy',
  BP: 'energy',
  'ConocoPhillips': 'energy',
  'NextEra Energy': 'energy',
  'Duke Energy': 'energy',
  'Southern Company': 'energy',

  // Insurance
  'State Farm': 'insurance',
  Geico: 'insurance',
  Progressive: 'insurance',
  Allstate: 'insurance',
  Liberty: 'insurance',
  'Liberty Mutual': 'insurance',
  'MetLife': 'insurance',
  Prudential: 'insurance',
  AIG: 'insurance',
  Lemonade: 'insurance',

  // Travel & Hospitality
  Booking: 'travel',
  'Booking.com': 'travel',
  Expedia: 'travel',
  Marriott: 'travel',
  Hilton: 'travel',
  Hyatt: 'travel',
  'IHG': 'travel',
  Tripadvisor: 'travel',

  // EdTech
  Coursera: 'edtech',
  Udemy: 'edtech',
  LinkedIn: 'hr_tech',
  'LinkedIn Learning': 'edtech',
  Duolingo: 'edtech',
  'Khan Academy': 'edtech',
  Chegg: 'edtech',
  '2U': 'edtech',
  Instructure: 'edtech',
  Canvas: 'edtech',

  // Real Estate
  Zillow: 'real_estate',
  Redfin: 'real_estate',
  Compass: 'real_estate',
  Opendoor: 'real_estate',
  'CoStar': 'real_estate',

  // Web3 & Crypto
  Binance: 'web3',
  FTX: 'web3',
  Kraken: 'web3',
  'Crypto.com': 'web3',
  OpenSea: 'web3',
  Alchemy: 'web3',
  Infura: 'web3',
  'ConsenSys': 'web3',
  Chainalysis: 'web3',
  'Circle': 'web3',
  'Anchorage': 'web3',
};

// ==================== Helper Functions ====================

/**
 * Get industry for a company
 */
export function getCompanyIndustry(company: string): string | null {
  // Try exact match first
  if (COMPANY_INDUSTRY_MAP[company]) {
    return COMPANY_INDUSTRY_MAP[company];
  }

  // Try case-insensitive match
  const companyLower = company.toLowerCase();
  for (const [name, industry] of Object.entries(COMPANY_INDUSTRY_MAP)) {
    if (name.toLowerCase() === companyLower) {
      return industry;
    }
  }

  // Try partial match (for variations like "Google Inc." or "Amazon.com")
  for (const [name, industry] of Object.entries(COMPANY_INDUSTRY_MAP)) {
    if (
      companyLower.includes(name.toLowerCase()) ||
      name.toLowerCase().includes(companyLower)
    ) {
      return industry;
    }
  }

  return null;
}

/**
 * Check if a company is well-known (in our database)
 */
export function isKnownCompany(company: string): boolean {
  return getCompanyIndustry(company) !== null;
}

/**
 * Get all companies in a specific industry
 */
export function getCompaniesInIndustry(industry: string): string[] {
  const companies: string[] = [];
  for (const [company, ind] of Object.entries(COMPANY_INDUSTRY_MAP)) {
    if (ind === industry) {
      companies.push(company);
    }
  }
  return companies.sort();
}

/**
 * Extract industries from a list of companies
 */
export function extractIndustriesFromCompanies(companies: string[]): string[] {
  const industries = new Set<string>();
  for (const company of companies) {
    const industry = getCompanyIndustry(company);
    if (industry) {
      industries.add(industry);
    }
  }
  return Array.from(industries).sort();
}

/**
 * Check if a company is FAANG (or equivalent big tech)
 */
export function isFAANGCompany(company: string): boolean {
  const faangCompanies = [
    'Google',
    'Alphabet',
    'Apple',
    'Amazon',
    'Meta',
    'Facebook',
    'Netflix',
    'Microsoft',
    'NVIDIA',
  ];

  const companyLower = company.toLowerCase();
  return faangCompanies.some(
    (f) =>
      f.toLowerCase() === companyLower ||
      companyLower.includes(f.toLowerCase())
  );
}

/**
 * Check if a company is a unicorn or high-growth startup
 */
export function isUnicornCompany(company: string): boolean {
  const unicorns = [
    'Stripe',
    'Airbnb',
    'Uber',
    'Lyft',
    'DoorDash',
    'Instacart',
    'Robinhood',
    'Coinbase',
    'SpaceX',
    'OpenAI',
    'Anthropic',
    'Figma',
    'Notion',
    'Canva',
    'Discord',
    'Databricks',
    'Snowflake',
    'Plaid',
    'Ramp',
    'Brex',
    'Chime',
    'Klarna',
    'Rivian',
  ];

  const companyLower = company.toLowerCase();
  return unicorns.some(
    (u) =>
      u.toLowerCase() === companyLower ||
      companyLower.includes(u.toLowerCase())
  );
}
