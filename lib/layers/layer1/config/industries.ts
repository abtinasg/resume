/**
 * Layer 1 - Evaluation Engine
 * Industries Configuration
 *
 * Contains industry keywords for inferring domains from resume content.
 */

// ==================== Industry Categories ====================

/**
 * Industry categories with associated keywords
 */
export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  // Technology
  software: [
    'software',
    'saas',
    'paas',
    'iaas',
    'platform',
    'application',
    'api',
    'sdk',
    'developer tools',
    'devtools',
    'cloud computing',
    'web development',
    'mobile development',
    'enterprise software',
  ],

  // Finance
  finance: [
    'banking',
    'financial',
    'investment',
    'trading',
    'securities',
    'wealth management',
    'portfolio',
    'hedge fund',
    'asset management',
    'capital markets',
    'derivatives',
    'risk management',
    'compliance',
  ],

  fintech: [
    'fintech',
    'payment',
    'payments',
    'lending',
    'neobank',
    'digital banking',
    'cryptocurrency',
    'blockchain',
    'defi',
    'insurtech',
    'regtech',
    'open banking',
    'peer-to-peer',
    'mobile payments',
  ],

  // Healthcare
  healthcare: [
    'healthcare',
    'health care',
    'medical',
    'clinical',
    'patient',
    'hospital',
    'physician',
    'diagnosis',
    'treatment',
    'pharmaceutical',
    'drug',
    'therapy',
    'wellness',
    'telehealth',
    'telemedicine',
    'ehr',
    'electronic health records',
  ],

  biotech: [
    'biotech',
    'biotechnology',
    'genomics',
    'life sciences',
    'clinical trials',
    'fda',
    'drug discovery',
    'molecular',
    'bioinformatics',
    'gene therapy',
    'immunotherapy',
  ],

  // E-commerce & Retail
  ecommerce: [
    'e-commerce',
    'ecommerce',
    'online retail',
    'marketplace',
    'shopping',
    'cart',
    'checkout',
    'fulfillment',
    'inventory',
    'supply chain',
    'wholesale',
    'direct to consumer',
    'd2c',
    'dropship',
  ],

  retail: [
    'retail',
    'store',
    'pos',
    'point of sale',
    'merchandising',
    'omnichannel',
    'brick and mortar',
    'consumer goods',
    'cpg',
    'fmcg',
  ],

  // Media & Entertainment
  media: [
    'media',
    'publishing',
    'content',
    'editorial',
    'journalism',
    'news',
    'broadcast',
    'digital media',
    'streaming',
    'podcast',
  ],

  entertainment: [
    'entertainment',
    'gaming',
    'video games',
    'esports',
    'music',
    'film',
    'television',
    'tv',
    'streaming service',
    'netflix',
    'spotify',
  ],

  // Marketing & Advertising
  marketing: [
    'marketing',
    'advertising',
    'ad tech',
    'adtech',
    'digital marketing',
    'seo',
    'sem',
    'social media marketing',
    'content marketing',
    'brand',
    'campaign',
    'performance marketing',
    'programmatic',
    'martech',
  ],

  // Education
  edtech: [
    'edtech',
    'education technology',
    'e-learning',
    'elearning',
    'online learning',
    'lms',
    'learning management',
    'mooc',
    'courseware',
    'tutoring',
    'educational',
    'k-12',
    'higher education',
  ],

  // Real Estate
  real_estate: [
    'real estate',
    'property',
    'proptech',
    'mortgage',
    'housing',
    'commercial real estate',
    'residential',
    'leasing',
    'rental',
    'property management',
    'mls',
  ],

  // Transportation & Logistics
  logistics: [
    'logistics',
    'supply chain',
    'shipping',
    'freight',
    'warehouse',
    'distribution',
    '3pl',
    'fulfillment',
    'last mile',
    'delivery',
    'fleet management',
  ],

  transportation: [
    'transportation',
    'mobility',
    'rideshare',
    'autonomous',
    'self-driving',
    'electric vehicle',
    'ev',
    'automotive',
    'aviation',
    'airline',
  ],

  // Food & Agriculture
  foodtech: [
    'foodtech',
    'food technology',
    'food delivery',
    'restaurant tech',
    'ghost kitchen',
    'meal kit',
    'food service',
    'agriculture',
    'agtech',
    'farming',
    'agricultural',
  ],

  // Energy & Sustainability
  energy: [
    'energy',
    'oil',
    'gas',
    'petroleum',
    'utilities',
    'power',
    'electricity',
    'grid',
    'renewable',
    'solar',
    'wind',
    'cleantech',
    'sustainability',
    'green energy',
    'carbon',
  ],

  // Manufacturing
  manufacturing: [
    'manufacturing',
    'factory',
    'production',
    'assembly',
    'industrial',
    'automation',
    'robotics',
    'iot',
    'internet of things',
    'smart factory',
    'industry 4.0',
  ],

  // Insurance
  insurance: [
    'insurance',
    'insurtech',
    'underwriting',
    'claims',
    'actuarial',
    'policy',
    'coverage',
    'reinsurance',
    'life insurance',
    'health insurance',
    'property insurance',
  ],

  // Legal
  legal: [
    'legal',
    'law',
    'legaltech',
    'legal tech',
    'attorney',
    'lawyer',
    'litigation',
    'contract',
    'compliance',
    'regulatory',
    'ip',
    'intellectual property',
  ],

  // HR & Recruiting
  hr_tech: [
    'hr tech',
    'hrtech',
    'human resources',
    'recruiting',
    'talent acquisition',
    'ats',
    'applicant tracking',
    'hris',
    'payroll',
    'benefits',
    'compensation',
    'employee engagement',
    'workforce',
  ],

  // Consulting
  consulting: [
    'consulting',
    'advisory',
    'professional services',
    'strategy consulting',
    'management consulting',
    'technology consulting',
    'implementation',
    'transformation',
    'digital transformation',
  ],

  // Telecommunications
  telecom: [
    'telecom',
    'telecommunications',
    'wireless',
    '5g',
    'network',
    'mobile network',
    'carrier',
    'isp',
    'internet provider',
    'broadband',
  ],

  // Cybersecurity
  cybersecurity: [
    'cybersecurity',
    'security',
    'infosec',
    'information security',
    'threat',
    'vulnerability',
    'penetration testing',
    'soc',
    'security operations',
    'encryption',
    'identity',
    'access management',
  ],

  // AI & Machine Learning
  ai_ml: [
    'artificial intelligence',
    'machine learning',
    'deep learning',
    'neural network',
    'nlp',
    'natural language processing',
    'computer vision',
    'data science',
    'predictive analytics',
    'ml ops',
    'mlops',
  ],

  // Government & Public Sector
  government: [
    'government',
    'public sector',
    'federal',
    'state',
    'municipal',
    'civic tech',
    'govtech',
    'defense',
    'military',
    'national security',
  ],

  // Nonprofit
  nonprofit: [
    'nonprofit',
    'non-profit',
    'ngo',
    'charity',
    'foundation',
    'philanthropy',
    'social impact',
    'mission-driven',
  ],

  // Travel & Hospitality
  travel: [
    'travel',
    'hospitality',
    'hotel',
    'tourism',
    'booking',
    'reservation',
    'airline',
    'vacation',
    'adventure',
  ],

  // Web3 & Crypto
  web3: [
    'web3',
    'blockchain',
    'cryptocurrency',
    'crypto',
    'nft',
    'defi',
    'decentralized',
    'smart contract',
    'ethereum',
    'bitcoin',
    'dao',
    'token',
  ],
};

// ==================== Major Industries List ====================

/**
 * List of major industry categories
 */
export const MAJOR_INDUSTRIES = [
  'software',
  'finance',
  'fintech',
  'healthcare',
  'biotech',
  'ecommerce',
  'retail',
  'media',
  'entertainment',
  'marketing',
  'edtech',
  'real_estate',
  'logistics',
  'transportation',
  'foodtech',
  'energy',
  'manufacturing',
  'insurance',
  'legal',
  'hr_tech',
  'consulting',
  'telecom',
  'cybersecurity',
  'ai_ml',
  'government',
  'nonprofit',
  'travel',
  'web3',
] as const;

export type IndustryType = (typeof MAJOR_INDUSTRIES)[number];

// ==================== Helper Functions ====================

/**
 * Detect industries from text content
 */
export function detectIndustries(text: string): string[] {
  const textLower = text.toLowerCase();
  const detected = new Set<string>();

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matchCount = keywords.filter((kw) => textLower.includes(kw)).length;
    // Require at least 2 keyword matches for confidence
    if (matchCount >= 2) {
      detected.add(industry);
    }
  }

  return Array.from(detected).sort();
}

/**
 * Get display name for an industry
 */
export function getIndustryDisplayName(industry: string): string {
  const displayNames: Record<string, string> = {
    software: 'Software & Technology',
    finance: 'Finance & Banking',
    fintech: 'FinTech',
    healthcare: 'Healthcare',
    biotech: 'Biotechnology',
    ecommerce: 'E-commerce',
    retail: 'Retail',
    media: 'Media & Publishing',
    entertainment: 'Entertainment & Gaming',
    marketing: 'Marketing & Advertising',
    edtech: 'Education Technology',
    real_estate: 'Real Estate',
    logistics: 'Logistics & Supply Chain',
    transportation: 'Transportation & Mobility',
    foodtech: 'Food Technology',
    energy: 'Energy & Sustainability',
    manufacturing: 'Manufacturing',
    insurance: 'Insurance',
    legal: 'Legal',
    hr_tech: 'HR Technology',
    consulting: 'Consulting',
    telecom: 'Telecommunications',
    cybersecurity: 'Cybersecurity',
    ai_ml: 'AI & Machine Learning',
    government: 'Government & Public Sector',
    nonprofit: 'Nonprofit',
    travel: 'Travel & Hospitality',
    web3: 'Web3 & Blockchain',
  };

  return displayNames[industry] || industry;
}

/**
 * Get keywords for a specific industry
 */
export function getIndustryKeywords(industry: string): string[] {
  return INDUSTRY_KEYWORDS[industry] || [];
}
