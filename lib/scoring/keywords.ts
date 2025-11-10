/**
 * PRO Resume Scoring System - Keyword Database
 *
 * This module contains comprehensive keyword databases for different job roles.
 * Keywords are categorized by importance (must-have, important, nice-to-have)
 * and are used for ATS compatibility scoring and keyword gap analysis.
 */

import { KeywordDatabase, ActionVerbCategories } from './types';

/**
 * Action Verbs categorized by strength
 * Used for evaluating the quality of bullet points
 */
export const ACTION_VERBS: ActionVerbCategories = {
  strong: [
    // Leadership & Initiative
    'Led', 'Spearheaded', 'Pioneered', 'Founded', 'Established', 'Launched',
    'Directed', 'Orchestrated', 'Championed', 'Drove', 'Initiated',

    // Technical Excellence
    'Architected', 'Engineered', 'Designed', 'Developed', 'Built', 'Implemented',
    'Deployed', 'Automated', 'Integrated', 'Migrated', 'Optimized',

    // Impact & Results
    'Achieved', 'Delivered', 'Accelerated', 'Increased', 'Reduced', 'Improved',
    'Enhanced', 'Streamlined', 'Transformed', 'Revolutionized', 'Maximized',

    // Strategic
    'Strategized', 'Scaled', 'Expanded', 'Grew', 'Generated', 'Captured',
  ],

  medium: [
    // Management
    'Managed', 'Supervised', 'Coordinated', 'Oversaw', 'Administered',

    // Collaboration
    'Collaborated', 'Partnered', 'Worked', 'Contributed', 'Participated',

    // Development
    'Created', 'Produced', 'Maintained', 'Updated', 'Modified', 'Revised',

    // Analysis & Planning
    'Analyzed', 'Evaluated', 'Assessed', 'Planned', 'Researched', 'Investigated',

    // Communication
    'Presented', 'Communicated', 'Documented', 'Reported', 'Trained', 'Mentored',
  ],

  weak: [
    // Passive involvement
    'Responsible for', 'Helped with', 'Assisted with', 'Involved in',
    'Participated in', 'Contributed to', 'Worked on', 'Part of',

    // Vague actions
    'Helped', 'Assisted', 'Supported', 'Aided', 'Handled', 'Dealt with',
    'Was responsible', 'Tasked with', 'Duties included',
  ],
};

/**
 * Main keyword database for different job roles
 * Each role has keywords categorized by importance for ATS optimization
 */
export const KEYWORDS_BY_ROLE: KeywordDatabase = {
  // ==================== Product Management ====================
  'Product Manager': {
    mustHave: [
      'roadmap', 'backlog', 'sprint', 'agile', 'scrum', 'kanban',
      'OKRs', 'KPIs', 'metrics', 'stakeholder', 'prioritization',
      'product strategy', 'product vision', 'user stories', 'requirements',
      'cross-functional', 'product lifecycle', 'go-to-market',
    ],
    important: [
      'A/B testing', 'analytics', 'data-driven', 'user research',
      'PRD', 'product requirements document', 'wireframes', 'prototypes',
      'market research', 'competitive analysis', 'feature development',
      'product launch', 'user experience', 'customer feedback',
      'SQL', 'API', 'technical specifications', 'engineering collaboration',
    ],
    niceToHave: [
      'growth hacking', 'retention', 'activation', 'conversion',
      'funnel analysis', 'cohort analysis', 'JIRA', 'Confluence',
      'Figma', 'Sketch', 'product analytics', 'mixpanel', 'amplitude',
      'product-market fit', 'MVP', 'minimum viable product',
    ],
  },

  // ==================== Software Engineering ====================
  'Software Engineer': {
    mustHave: [
      'programming', 'coding', 'software development', 'algorithms',
      'data structures', 'debugging', 'testing', 'code review',
      'version control', 'Git', 'API', 'REST', 'database',
      'architecture', 'design patterns', 'object-oriented',
    ],
    important: [
      // Languages
      'Python', 'JavaScript', 'Java', 'C++', 'TypeScript', 'Go', 'Ruby',

      // Frameworks & Tools
      'React', 'Node.js', 'Angular', 'Vue', 'Django', 'Flask', 'Spring',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD',

      // Practices
      'microservices', 'agile', 'scrum', 'TDD', 'unit testing',
      'integration testing', 'performance optimization', 'scalability',
    ],
    niceToHave: [
      'GraphQL', 'Redis', 'MongoDB', 'PostgreSQL', 'Elasticsearch',
      'Kafka', 'RabbitMQ', 'Terraform', 'Jenkins', 'GitHub Actions',
      'machine learning', 'AI', 'distributed systems', 'cloud architecture',
      'serverless', 'Lambda', 'WebSockets', 'gRPC',
    ],
  },

  // ==================== Frontend Engineer ====================
  'Frontend Engineer': {
    mustHave: [
      'HTML', 'CSS', 'JavaScript', 'responsive design', 'UI', 'UX',
      'web development', 'frontend', 'user interface', 'cross-browser',
      'accessibility', 'performance', 'React', 'component',
    ],
    important: [
      'TypeScript', 'Redux', 'state management', 'Webpack', 'Babel',
      'Vue', 'Angular', 'Next.js', 'Gatsby', 'SASS', 'LESS',
      'styled-components', 'CSS-in-JS', 'mobile-first', 'PWA',
      'SEO', 'web performance', 'lazy loading', 'code splitting',
    ],
    niceToHave: [
      'GraphQL', 'Apollo', 'testing library', 'Jest', 'Cypress',
      'Storybook', 'Figma', 'design system', 'animation', 'Three.js',
      'WebGL', 'Canvas', 'service workers', 'web animations',
    ],
  },

  // ==================== Backend Engineer ====================
  'Backend Engineer': {
    mustHave: [
      'backend', 'server-side', 'API', 'REST', 'database', 'SQL',
      'NoSQL', 'microservices', 'architecture', 'scalability',
      'performance', 'security', 'authentication', 'authorization',
    ],
    important: [
      'Node.js', 'Python', 'Java', 'Go', 'Ruby', 'PHP',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'Docker', 'Kubernetes', 'AWS', 'cloud', 'serverless',
      'message queue', 'caching', 'load balancing', 'rate limiting',
    ],
    niceToHave: [
      'GraphQL', 'gRPC', 'Kafka', 'RabbitMQ', 'Terraform',
      'distributed systems', 'event-driven', 'CQRS', 'DDD',
      'monitoring', 'logging', 'observability', 'APM',
    ],
  },

  // ==================== Data Analyst ====================
  'Data Analyst': {
    mustHave: [
      'SQL', 'Excel', 'data analysis', 'data visualization', 'reporting',
      'dashboard', 'metrics', 'KPIs', 'statistics', 'analytics',
      'insights', 'business intelligence', 'data-driven',
    ],
    important: [
      'Python', 'R', 'Tableau', 'Power BI', 'Looker', 'Google Analytics',
      'ETL', 'data pipeline', 'data cleaning', 'data transformation',
      'forecasting', 'trend analysis', 'statistical analysis',
      'A/B testing', 'hypothesis testing', 'regression',
    ],
    niceToHave: [
      'pandas', 'numpy', 'matplotlib', 'seaborn', 'Jupyter',
      'machine learning', 'predictive modeling', 'data mining',
      'big data', 'Spark', 'Hadoop', 'AWS', 'cloud',
    ],
  },

  // ==================== Data Scientist ====================
  'Data Scientist': {
    mustHave: [
      'machine learning', 'statistical modeling', 'Python', 'R',
      'data analysis', 'predictive modeling', 'algorithms',
      'statistics', 'hypothesis testing', 'A/B testing',
    ],
    important: [
      'scikit-learn', 'TensorFlow', 'PyTorch', 'pandas', 'numpy',
      'deep learning', 'neural networks', 'NLP', 'computer vision',
      'feature engineering', 'model evaluation', 'cross-validation',
      'SQL', 'big data', 'Spark', 'data pipeline',
    ],
    niceToHave: [
      'Keras', 'XGBoost', 'LightGBM', 'time series', 'forecasting',
      'reinforcement learning', 'Kubernetes', 'Docker', 'MLOps',
      'model deployment', 'AWS SageMaker', 'Azure ML', 'GCP AI',
    ],
  },

  // ==================== DevOps Engineer ====================
  'DevOps Engineer': {
    mustHave: [
      'CI/CD', 'automation', 'infrastructure', 'deployment', 'Docker',
      'Kubernetes', 'cloud', 'AWS', 'monitoring', 'logging',
      'infrastructure as code', 'DevOps', 'site reliability',
    ],
    important: [
      'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI',
      'Azure', 'GCP', 'Linux', 'bash', 'scripting', 'Python',
      'Prometheus', 'Grafana', 'ELK stack', 'alerting',
      'load balancing', 'networking', 'security', 'SSL/TLS',
    ],
    niceToHave: [
      'Helm', 'ArgoCD', 'Service mesh', 'Istio', 'serverless',
      'CloudFormation', 'CDK', 'cost optimization', 'disaster recovery',
      'high availability', 'chaos engineering', 'observability',
    ],
  },

  // ==================== UX/UI Designer ====================
  'UX Designer': {
    mustHave: [
      'UX', 'user experience', 'UI', 'user interface', 'wireframes',
      'prototypes', 'user research', 'usability', 'user testing',
      'design thinking', 'interaction design', 'information architecture',
    ],
    important: [
      'Figma', 'Sketch', 'Adobe XD', 'InVision', 'user flows',
      'personas', 'journey mapping', 'A/B testing', 'accessibility',
      'responsive design', 'mobile design', 'design system',
      'heuristic evaluation', 'usability testing', 'user interviews',
    ],
    niceToHave: [
      'HTML', 'CSS', 'JavaScript', 'prototyping', 'animation',
      'micro-interactions', 'design tokens', 'component library',
      'Storybook', 'Zeplin', 'design handoff', 'agile', 'scrum',
    ],
  },

  // ==================== Marketing Manager ====================
  'Marketing Manager': {
    mustHave: [
      'marketing strategy', 'campaign', 'brand', 'digital marketing',
      'content marketing', 'SEO', 'SEM', 'social media',
      'marketing analytics', 'ROI', 'lead generation', 'conversion',
    ],
    important: [
      'Google Analytics', 'Google Ads', 'Facebook Ads', 'email marketing',
      'marketing automation', 'CRM', 'Salesforce', 'HubSpot',
      'A/B testing', 'growth marketing', 'funnel optimization',
      'content strategy', 'copywriting', 'brand positioning',
    ],
    niceToHave: [
      'SQL', 'data analysis', 'Tableau', 'marketing mix modeling',
      'attribution', 'customer segmentation', 'lifecycle marketing',
      'influencer marketing', 'affiliate marketing', 'PR',
    ],
  },

  // ==================== Sales Manager ====================
  'Sales Manager': {
    mustHave: [
      'sales', 'revenue', 'quota', 'pipeline', 'forecasting',
      'lead generation', 'prospecting', 'closing', 'negotiation',
      'account management', 'CRM', 'sales strategy', 'B2B', 'B2C',
    ],
    important: [
      'Salesforce', 'sales process', 'sales enablement', 'team leadership',
      'territory management', 'relationship building', 'enterprise sales',
      'solution selling', 'consultative selling', 'cold calling',
      'presentations', 'proposals', 'contracts', 'upselling',
    ],
    niceToHave: [
      'sales automation', 'sales analytics', 'sales operations',
      'channel sales', 'partner management', 'inside sales',
      'field sales', 'sales training', 'coaching', 'mentoring',
    ],
  },

  // ==================== General (Default) ====================
  'General': {
    mustHave: [
      'leadership', 'teamwork', 'communication', 'problem-solving',
      'project management', 'collaboration', 'results-driven',
      'analytical', 'strategic', 'innovation',
    ],
    important: [
      'agile', 'cross-functional', 'stakeholder management',
      'process improvement', 'data-driven', 'customer-focused',
      'time management', 'multitasking', 'adaptable',
    ],
    niceToHave: [
      'mentoring', 'coaching', 'training', 'documentation',
      'presentation', 'negotiation', 'conflict resolution',
    ],
  },
};

/**
 * Standard resume section headers (for ATS compatibility)
 */
export const STANDARD_SECTION_HEADERS = [
  // Experience
  'Experience', 'Work Experience', 'Professional Experience',
  'Employment History', 'Career History',

  // Education
  'Education', 'Academic Background', 'Educational Background',

  // Skills
  'Skills', 'Technical Skills', 'Core Competencies', 'Areas of Expertise',

  // Projects
  'Projects', 'Key Projects', 'Notable Projects',

  // Certifications
  'Certifications', 'Licenses & Certifications', 'Professional Certifications',

  // Summary
  'Summary', 'Professional Summary', 'Executive Summary', 'Profile',

  // Others
  'Achievements', 'Awards', 'Publications', 'Languages', 'Volunteer',
];

/**
 * Non-standard section headers that should be avoided for ATS
 */
export const NON_STANDARD_HEADERS = [
  'My Journey', 'About Me', 'Who I Am', 'My Story',
  'What I Do', 'My Expertise', 'Things I\'ve Done',
];

/**
 * Words/phrases that indicate quantification in bullet points
 */
export const QUANTIFICATION_INDICATORS = [
  // Percentages
  '%', 'percent', 'percentage',

  // Currency
  '$', '€', '£', '¥', 'USD', 'EUR', 'GBP',
  'million', 'billion', 'thousand', 'K', 'M', 'B',

  // Numbers (will be checked with regex)
  // Patterns: 10+, 50%, $1M, 2x, 3.5K, etc.

  // Scale indicators
  'increased', 'decreased', 'reduced', 'improved', 'grew',
  'scaled', 'expanded', 'accelerated', 'optimized',

  // Time-based metrics
  'days', 'weeks', 'months', 'years', 'hours',

  // Volume indicators
  'users', 'customers', 'projects', 'teams', 'members',
  'tickets', 'requests', 'features', 'releases',
];

/**
 * Get keywords for a specific role
 * Returns General keywords if role not found
 */
export function getKeywordsForRole(role: string): {
  mustHave: string[];
  important: string[];
  niceToHave: string[];
} {
  // Normalize role name
  const normalizedRole = role.trim();

  // Try exact match
  if (KEYWORDS_BY_ROLE[normalizedRole]) {
    return KEYWORDS_BY_ROLE[normalizedRole];
  }

  // Try partial match (case-insensitive)
  const roleKey = Object.keys(KEYWORDS_BY_ROLE).find(
    key => key.toLowerCase() === normalizedRole.toLowerCase()
  );

  if (roleKey) {
    return KEYWORDS_BY_ROLE[roleKey];
  }

  // Try contains match
  const containsMatch = Object.keys(KEYWORDS_BY_ROLE).find(
    key => normalizedRole.toLowerCase().includes(key.toLowerCase()) ||
           key.toLowerCase().includes(normalizedRole.toLowerCase())
  );

  if (containsMatch) {
    return KEYWORDS_BY_ROLE[containsMatch];
  }

  // Return General as fallback
  return KEYWORDS_BY_ROLE['General'];
}

/**
 * Get all available role names
 */
export function getAvailableRoles(): string[] {
  return Object.keys(KEYWORDS_BY_ROLE);
}

/**
 * Check if a role exists in the database
 */
export function isRoleSupported(role: string): boolean {
  const normalizedRole = role.trim().toLowerCase();
  return Object.keys(KEYWORDS_BY_ROLE).some(
    key => key.toLowerCase() === normalizedRole
  );
}
