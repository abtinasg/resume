/**
 * Layer 1 - Evaluation Engine
 * Skills Configuration
 *
 * Contains skill normalization mappings and skill categories
 * for standardizing skills across different resume formats.
 */

// ==================== Skill Categories ====================

/**
 * Skill categories for organization and analysis
 */
export const SKILL_CATEGORIES = {
  programming_languages: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Go',
    'Rust',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
    'Scala',
    'R',
    'MATLAB',
    'Perl',
    'Shell',
    'Bash',
    'PowerShell',
    'SQL',
    'C',
    'Objective-C',
    'Dart',
    'Elixir',
    'Clojure',
    'Haskell',
    'F#',
    'Julia',
    'Lua',
    'Groovy',
  ],
  frontend_frameworks: [
    'React',
    'Angular',
    'Vue.js',
    'Svelte',
    'Next.js',
    'Nuxt.js',
    'Gatsby',
    'Ember.js',
    'Backbone.js',
    'jQuery',
    'Bootstrap',
    'Tailwind CSS',
    'Material UI',
    'Chakra UI',
    'Ant Design',
    'Styled Components',
    'SASS',
    'LESS',
    'CSS Modules',
  ],
  backend_frameworks: [
    'Node.js',
    'Express.js',
    'Django',
    'Flask',
    'FastAPI',
    'Spring Boot',
    'Spring',
    'Ruby on Rails',
    'Laravel',
    'ASP.NET',
    '.NET Core',
    'NestJS',
    'Koa',
    'Hapi',
    'Phoenix',
    'Gin',
    'Echo',
    'Fiber',
    'Actix',
  ],
  mobile_development: [
    'React Native',
    'Flutter',
    'iOS',
    'Android',
    'SwiftUI',
    'Kotlin Multiplatform',
    'Xamarin',
    'Ionic',
    'Cordova',
    'Capacitor',
    'Expo',
  ],
  databases: [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'SQLite',
    'Oracle',
    'SQL Server',
    'Cassandra',
    'DynamoDB',
    'Firebase',
    'Supabase',
    'CouchDB',
    'Neo4j',
    'Elasticsearch',
    'InfluxDB',
    'TimescaleDB',
  ],
  cloud_platforms: [
    'AWS',
    'Google Cloud',
    'Azure',
    'Heroku',
    'Vercel',
    'Netlify',
    'DigitalOcean',
    'Cloudflare',
    'IBM Cloud',
    'Oracle Cloud',
    'Alibaba Cloud',
  ],
  devops_tools: [
    'Docker',
    'Kubernetes',
    'Jenkins',
    'GitLab CI',
    'GitHub Actions',
    'CircleCI',
    'Travis CI',
    'Terraform',
    'Ansible',
    'Puppet',
    'Chef',
    'Vagrant',
    'Helm',
    'ArgoCD',
    'Prometheus',
    'Grafana',
    'ELK Stack',
    'Datadog',
    'New Relic',
  ],
  data_science: [
    'Machine Learning',
    'Deep Learning',
    'TensorFlow',
    'PyTorch',
    'Keras',
    'scikit-learn',
    'Pandas',
    'NumPy',
    'SciPy',
    'Matplotlib',
    'Seaborn',
    'Tableau',
    'Power BI',
    'Apache Spark',
    'Hadoop',
    'Data Analysis',
    'Data Visualization',
    'Natural Language Processing',
    'Computer Vision',
  ],
  design_tools: [
    'Figma',
    'Sketch',
    'Adobe XD',
    'Adobe Photoshop',
    'Adobe Illustrator',
    'InVision',
    'Zeplin',
    'Framer',
    'Canva',
    'Principle',
    'ProtoPie',
    'Miro',
    'FigJam',
  ],
  project_management: [
    'Agile',
    'Scrum',
    'Kanban',
    'JIRA',
    'Asana',
    'Trello',
    'Monday.com',
    'Notion',
    'Confluence',
    'Linear',
    'ClickUp',
    'Basecamp',
  ],
  soft_skills: [
    'Leadership',
    'Communication',
    'Problem Solving',
    'Critical Thinking',
    'Teamwork',
    'Collaboration',
    'Time Management',
    'Project Management',
    'Mentoring',
    'Public Speaking',
    'Negotiation',
    'Conflict Resolution',
    'Decision Making',
    'Strategic Planning',
    'Stakeholder Management',
    'Cross-functional Collaboration',
    'Adaptability',
    'Creativity',
    'Emotional Intelligence',
    'Attention to Detail',
  ],
  testing_qa: [
    'Unit Testing',
    'Integration Testing',
    'E2E Testing',
    'Jest',
    'Mocha',
    'Chai',
    'Cypress',
    'Playwright',
    'Selenium',
    'Puppeteer',
    'TestNG',
    'JUnit',
    'pytest',
    'RSpec',
    'Test-Driven Development',
    'Behavior-Driven Development',
  ],
  version_control: [
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'SVN',
    'Mercurial',
  ],
  api_development: [
    'REST',
    'GraphQL',
    'gRPC',
    'WebSocket',
    'OpenAPI',
    'Swagger',
    'Postman',
    'API Design',
    'Microservices',
    'Service-Oriented Architecture',
  ],
  security: [
    'Cybersecurity',
    'Penetration Testing',
    'OWASP',
    'OAuth',
    'JWT',
    'SSL/TLS',
    'Encryption',
    'Security Auditing',
    'Vulnerability Assessment',
    'Identity Management',
  ],
  domain_expertise: [
    'FinTech',
    'Healthcare',
    'E-commerce',
    'SaaS',
    'EdTech',
    'Gaming',
    'Real Estate',
    'Supply Chain',
    'Logistics',
    'Marketing',
    'Sales',
    'HR Tech',
    'Legal Tech',
    'Insurance',
    'Banking',
    'Payments',
    'Blockchain',
    'Web3',
    'IoT',
    'Robotics',
  ],
} as const;

// ==================== Skill Normalization ====================

/**
 * Map of variations to canonical skill names
 * Keys should be lowercase for matching
 */
export const SKILL_NORMALIZATION: Record<string, string> = {
  // JavaScript variations
  js: 'JavaScript',
  javascript: 'JavaScript',
  'java script': 'JavaScript',
  'node js': 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  node: 'Node.js',

  // TypeScript variations
  ts: 'TypeScript',
  typescript: 'TypeScript',
  'type script': 'TypeScript',

  // Python variations
  python: 'Python',
  python3: 'Python',
  'python 3': 'Python',
  'python 2': 'Python',
  py: 'Python',

  // Java variations
  java: 'Java',
  'java ee': 'Java',
  'java se': 'Java',
  'core java': 'Java',
  j2ee: 'Java',

  // C/C++ variations
  c: 'C',
  'c++': 'C++',
  cpp: 'C++',
  'c plus plus': 'C++',
  'c/c++': 'C++',

  // C# variations
  'c#': 'C#',
  csharp: 'C#',
  'c sharp': 'C#',
  '.net': '.NET',
  dotnet: '.NET',
  'asp.net': 'ASP.NET',

  // Go variations
  go: 'Go',
  golang: 'Go',

  // Rust variations
  rust: 'Rust',
  rustlang: 'Rust',

  // Ruby variations
  ruby: 'Ruby',
  ror: 'Ruby on Rails',
  rails: 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',

  // PHP variations
  php: 'PHP',
  'php 7': 'PHP',
  'php 8': 'PHP',

  // Swift variations
  swift: 'Swift',
  swiftui: 'SwiftUI',

  // Kotlin variations
  kotlin: 'Kotlin',

  // React variations
  react: 'React',
  reactjs: 'React',
  'react.js': 'React',
  'react js': 'React',
  'react native': 'React Native',
  reactnative: 'React Native',

  // Vue variations
  vue: 'Vue.js',
  vuejs: 'Vue.js',
  'vue.js': 'Vue.js',
  'vue js': 'Vue.js',
  vue3: 'Vue.js',
  'vue 3': 'Vue.js',
  nuxt: 'Nuxt.js',
  nuxtjs: 'Nuxt.js',
  'nuxt.js': 'Nuxt.js',

  // Angular variations
  angular: 'Angular',
  angularjs: 'Angular',
  'angular.js': 'Angular',
  angular2: 'Angular',
  'angular 2': 'Angular',

  // Next.js variations
  next: 'Next.js',
  nextjs: 'Next.js',
  'next.js': 'Next.js',

  // Express variations
  express: 'Express.js',
  expressjs: 'Express.js',
  'express.js': 'Express.js',

  // Django variations
  django: 'Django',
  'django rest framework': 'Django REST Framework',
  drf: 'Django REST Framework',

  // Flask variations
  flask: 'Flask',

  // FastAPI variations
  fastapi: 'FastAPI',
  'fast api': 'FastAPI',

  // Spring variations
  spring: 'Spring',
  'spring boot': 'Spring Boot',
  springboot: 'Spring Boot',
  'spring framework': 'Spring',

  // Database variations
  sql: 'SQL',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  psql: 'PostgreSQL',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  redis: 'Redis',
  sqlite: 'SQLite',
  oracle: 'Oracle',
  'oracle db': 'Oracle',
  'sql server': 'SQL Server',
  mssql: 'SQL Server',
  'microsoft sql server': 'SQL Server',
  cassandra: 'Cassandra',
  dynamodb: 'DynamoDB',
  'dynamo db': 'DynamoDB',
  elasticsearch: 'Elasticsearch',
  elastic: 'Elasticsearch',
  neo4j: 'Neo4j',

  // AWS variations
  aws: 'AWS',
  'amazon web services': 'AWS',
  ec2: 'AWS EC2',
  s3: 'AWS S3',
  lambda: 'AWS Lambda',
  'aws lambda': 'AWS Lambda',
  sqs: 'AWS SQS',
  sns: 'AWS SNS',
  rds: 'AWS RDS',
  ecs: 'AWS ECS',
  eks: 'AWS EKS',
  cloudfront: 'AWS CloudFront',

  // Google Cloud variations
  gcp: 'Google Cloud',
  'google cloud': 'Google Cloud',
  'google cloud platform': 'Google Cloud',
  'gcp bigquery': 'BigQuery',
  bigquery: 'BigQuery',

  // Azure variations
  azure: 'Azure',
  'microsoft azure': 'Azure',
  'azure devops': 'Azure DevOps',

  // DevOps tools
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  jenkins: 'Jenkins',
  terraform: 'Terraform',
  ansible: 'Ansible',
  puppet: 'Puppet',
  chef: 'Chef',
  helm: 'Helm',
  'gitlab ci': 'GitLab CI',
  'github actions': 'GitHub Actions',
  circleci: 'CircleCI',
  'travis ci': 'Travis CI',

  // Testing
  jest: 'Jest',
  mocha: 'Mocha',
  chai: 'Chai',
  cypress: 'Cypress',
  selenium: 'Selenium',
  playwright: 'Playwright',
  puppeteer: 'Puppeteer',
  pytest: 'pytest',
  junit: 'JUnit',
  rspec: 'RSpec',
  tdd: 'Test-Driven Development',
  bdd: 'Behavior-Driven Development',
  'unit testing': 'Unit Testing',
  'integration testing': 'Integration Testing',
  'e2e testing': 'E2E Testing',
  'end to end testing': 'E2E Testing',

  // Version control
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  svn: 'SVN',
  subversion: 'SVN',

  // API
  rest: 'REST',
  'rest api': 'REST',
  restful: 'REST',
  'restful api': 'REST',
  graphql: 'GraphQL',
  'graph ql': 'GraphQL',
  grpc: 'gRPC',
  websocket: 'WebSocket',
  websockets: 'WebSocket',
  swagger: 'Swagger',
  openapi: 'OpenAPI',

  // Design tools
  figma: 'Figma',
  sketch: 'Sketch',
  'adobe xd': 'Adobe XD',
  xd: 'Adobe XD',
  photoshop: 'Adobe Photoshop',
  illustrator: 'Adobe Illustrator',
  invision: 'InVision',
  zeplin: 'Zeplin',
  framer: 'Framer',
  canva: 'Canva',

  // Data science
  'machine learning': 'Machine Learning',
  ml: 'Machine Learning',
  'deep learning': 'Deep Learning',
  dl: 'Deep Learning',
  tensorflow: 'TensorFlow',
  tf: 'TensorFlow',
  pytorch: 'PyTorch',
  torch: 'PyTorch',
  keras: 'Keras',
  'scikit-learn': 'scikit-learn',
  sklearn: 'scikit-learn',
  pandas: 'Pandas',
  numpy: 'NumPy',
  scipy: 'SciPy',
  matplotlib: 'Matplotlib',
  seaborn: 'Seaborn',
  tableau: 'Tableau',
  'power bi': 'Power BI',
  powerbi: 'Power BI',
  spark: 'Apache Spark',
  'apache spark': 'Apache Spark',
  pyspark: 'Apache Spark',
  hadoop: 'Hadoop',
  nlp: 'Natural Language Processing',
  'natural language processing': 'Natural Language Processing',
  'computer vision': 'Computer Vision',
  cv: 'Computer Vision',
  ai: 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',

  // Project management
  agile: 'Agile',
  scrum: 'Scrum',
  kanban: 'Kanban',
  jira: 'JIRA',
  asana: 'Asana',
  trello: 'Trello',
  monday: 'Monday.com',
  'monday.com': 'Monday.com',
  notion: 'Notion',
  confluence: 'Confluence',
  linear: 'Linear',
  clickup: 'ClickUp',

  // CSS
  css: 'CSS',
  css3: 'CSS',
  html: 'HTML',
  html5: 'HTML',
  sass: 'SASS',
  scss: 'SASS',
  less: 'LESS',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  bootstrap: 'Bootstrap',
  'material ui': 'Material UI',
  mui: 'Material UI',
  'styled components': 'Styled Components',
  'chakra ui': 'Chakra UI',

  // Mobile
  ios: 'iOS',
  android: 'Android',
  flutter: 'Flutter',
  xamarin: 'Xamarin',
  ionic: 'Ionic',
  cordova: 'Cordova',
  capacitor: 'Capacitor',
  expo: 'Expo',

  // Soft skills
  leadership: 'Leadership',
  communication: 'Communication',
  'problem solving': 'Problem Solving',
  'problem-solving': 'Problem Solving',
  'critical thinking': 'Critical Thinking',
  teamwork: 'Teamwork',
  collaboration: 'Collaboration',
  'time management': 'Time Management',
  'project management': 'Project Management',
  mentoring: 'Mentoring',
  'public speaking': 'Public Speaking',
  negotiation: 'Negotiation',
  'strategic planning': 'Strategic Planning',
  'stakeholder management': 'Stakeholder Management',
  'cross-functional': 'Cross-functional Collaboration',
  adaptability: 'Adaptability',
  creativity: 'Creativity',

  // Security
  cybersecurity: 'Cybersecurity',
  'cyber security': 'Cybersecurity',
  infosec: 'Information Security',
  'penetration testing': 'Penetration Testing',
  pentest: 'Penetration Testing',
  owasp: 'OWASP',
  oauth: 'OAuth',
  oauth2: 'OAuth',
  jwt: 'JWT',
  'ssl/tls': 'SSL/TLS',
  ssl: 'SSL/TLS',
  tls: 'SSL/TLS',
  encryption: 'Encryption',

  // Microservices
  microservices: 'Microservices',
  'micro services': 'Microservices',
  soa: 'Service-Oriented Architecture',
  'service oriented architecture': 'Service-Oriented Architecture',
  'event-driven': 'Event-Driven Architecture',
  'event driven': 'Event-Driven Architecture',

  // Messaging
  kafka: 'Apache Kafka',
  'apache kafka': 'Apache Kafka',
  rabbitmq: 'RabbitMQ',
  'rabbit mq': 'RabbitMQ',
  activemq: 'ActiveMQ',

  // Monitoring
  prometheus: 'Prometheus',
  grafana: 'Grafana',
  datadog: 'Datadog',
  'new relic': 'New Relic',
  newrelic: 'New Relic',
  splunk: 'Splunk',
  elk: 'ELK Stack',
  'elk stack': 'ELK Stack',
  kibana: 'Kibana',
  logstash: 'Logstash',
};

/**
 * Get all skills in a category
 */
export function getSkillsInCategory(
  category: keyof typeof SKILL_CATEGORIES
): readonly string[] {
  return SKILL_CATEGORIES[category];
}

/**
 * Normalize a skill name to its canonical form
 */
export function normalizeSkill(skill: string): string {
  const normalized = skill.toLowerCase().trim();
  return SKILL_NORMALIZATION[normalized] || skill.trim();
}

/**
 * Normalize an array of skills
 */
export function normalizeSkills(skills: string[]): string[] {
  const normalized = new Set<string>();
  for (const skill of skills) {
    normalized.add(normalizeSkill(skill));
  }
  return Array.from(normalized).sort();
}

/**
 * Find the category for a skill
 */
export function findSkillCategory(skill: string): string | null {
  const normalizedSkill = normalizeSkill(skill);
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(normalizedSkill as never)) {
      return category;
    }
  }
  return null;
}

// ==================== Skill Recency Classification ====================

/**
 * Modern/recent technology skills (indicate learning and staying current)
 */
export const RECENT_TECH_SKILLS = [
  'TypeScript',
  'Rust',
  'Go',
  'Kubernetes',
  'React',
  'Next.js',
  'GraphQL',
  'Terraform',
  'AWS',
  'Docker',
  'GitHub Actions',
  'Tailwind CSS',
  'Svelte',
  'Deno',
  'Bun',
  'Astro',
  'Remix',
  'Prisma',
  'tRPC',
  'OpenAI',
  'LangChain',
  'Vector Databases',
  'Vercel',
  'Cloudflare Workers',
  'Edge Computing',
  'WebAssembly',
] as const;

/**
 * Legacy technology skills (when used alone, may indicate need to update)
 */
export const LEGACY_TECH_ONLY = [
  'jQuery',
  'Backbone.js',
  'CoffeeScript',
  'COBOL',
  'Fortran',
  'Visual Basic',
  'Perl',
  'CVS',
  'SVN',
  'Subversion',
  'FTP',
  'Flash',
  'ActionScript',
  'Cold Fusion',
] as const;
