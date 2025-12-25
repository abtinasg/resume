/**
 * Layer 1 - Evaluation Engine
 * Tools Configuration
 *
 * Contains tool detection patterns and tool categories
 * for identifying technologies and platforms in resumes.
 */

// ==================== Tool Categories ====================

/**
 * Tool categories for organization
 */
export const TOOL_CATEGORIES = {
  cloud_infrastructure: [
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
  ],
  containers_orchestration: [
    'Docker',
    'Kubernetes',
    'Docker Compose',
    'Podman',
    'containerd',
    'Helm',
    'OpenShift',
    'Rancher',
    'Amazon ECS',
    'Amazon EKS',
    'Google Kubernetes Engine',
    'Azure Kubernetes Service',
  ],
  ci_cd: [
    'Jenkins',
    'GitLab CI',
    'GitHub Actions',
    'CircleCI',
    'Travis CI',
    'TeamCity',
    'Bamboo',
    'Azure Pipelines',
    'Bitbucket Pipelines',
    'ArgoCD',
    'Spinnaker',
    'Drone',
  ],
  infrastructure_as_code: [
    'Terraform',
    'CloudFormation',
    'Pulumi',
    'Ansible',
    'Puppet',
    'Chef',
    'SaltStack',
    'Vagrant',
    'Packer',
  ],
  monitoring_observability: [
    'Prometheus',
    'Grafana',
    'Datadog',
    'New Relic',
    'Splunk',
    'ELK Stack',
    'Kibana',
    'Logstash',
    'Jaeger',
    'Zipkin',
    'PagerDuty',
    'OpsGenie',
    'Sentry',
    'Raygun',
  ],
  databases: [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Elasticsearch',
    'DynamoDB',
    'Cassandra',
    'CouchDB',
    'Neo4j',
    'InfluxDB',
    'Firebase',
    'Supabase',
  ],
  message_queues: [
    'Apache Kafka',
    'RabbitMQ',
    'Amazon SQS',
    'Redis Pub/Sub',
    'Google Pub/Sub',
    'Azure Service Bus',
    'ActiveMQ',
    'ZeroMQ',
  ],
  version_control: [
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'Azure DevOps',
    'Perforce',
    'SVN',
  ],
  api_tools: [
    'Postman',
    'Insomnia',
    'Swagger',
    'OpenAPI',
    'GraphQL Playground',
    'Apollo Studio',
    'SoapUI',
  ],
  design_collaboration: [
    'Figma',
    'Sketch',
    'Adobe XD',
    'InVision',
    'Zeplin',
    'Framer',
    'Miro',
    'FigJam',
    'Storybook',
  ],
  project_management: [
    'JIRA',
    'Asana',
    'Trello',
    'Monday.com',
    'Linear',
    'ClickUp',
    'Notion',
    'Confluence',
    'Basecamp',
  ],
  communication: [
    'Slack',
    'Microsoft Teams',
    'Discord',
    'Zoom',
    'Google Meet',
  ],
  ide_editors: [
    'VS Code',
    'IntelliJ IDEA',
    'PyCharm',
    'WebStorm',
    'Visual Studio',
    'Eclipse',
    'Sublime Text',
    'Vim',
    'Neovim',
    'Atom',
  ],
  testing_tools: [
    'Jest',
    'Cypress',
    'Playwright',
    'Selenium',
    'Postman',
    'JMeter',
    'LoadRunner',
    'Gatling',
    'SonarQube',
    'Codecov',
  ],
  security_tools: [
    'Snyk',
    'SonarQube',
    'Checkmarx',
    'OWASP ZAP',
    'Burp Suite',
    'Nessus',
    'Qualys',
    'HashiCorp Vault',
    'AWS Secrets Manager',
  ],
  data_analytics: [
    'Tableau',
    'Power BI',
    'Looker',
    'Google Analytics',
    'Mixpanel',
    'Amplitude',
    'Segment',
    'Apache Spark',
    'Apache Airflow',
    'dbt',
    'Snowflake',
    'Redshift',
    'BigQuery',
    'Databricks',
  ],
} as const;

// ==================== Tool Detection Patterns ====================

/**
 * Patterns for detecting tools in text
 * Each tool has multiple patterns for flexible matching
 */
export const TOOL_PATTERNS: Record<string, string[]> = {
  // Cloud Platforms
  AWS: ['aws', 'amazon web services', 'amazon cloud', 'ec2', 's3', 'lambda'],
  'Google Cloud': ['gcp', 'google cloud', 'google cloud platform', 'gke', 'bigquery'],
  Azure: ['azure', 'microsoft azure', 'aks', 'azure devops'],
  Heroku: ['heroku'],
  Vercel: ['vercel'],
  Netlify: ['netlify'],
  DigitalOcean: ['digitalocean', 'digital ocean'],
  Cloudflare: ['cloudflare', 'cf workers', 'cloudflare workers'],

  // Containers & Orchestration
  Docker: ['docker', 'dockerfile', 'docker-compose', 'docker compose', 'containerization', 'containerized'],
  Kubernetes: ['kubernetes', 'k8s', 'kubectl', 'helm charts'],
  'Docker Compose': ['docker-compose', 'docker compose'],
  'Amazon ECS': ['ecs', 'amazon ecs', 'elastic container service'],
  'Amazon EKS': ['eks', 'amazon eks', 'elastic kubernetes'],
  'Google Kubernetes Engine': ['gke', 'google kubernetes engine'],
  OpenShift: ['openshift', 'red hat openshift'],

  // CI/CD
  Jenkins: ['jenkins', 'jenkins pipeline', 'jenkinsfile'],
  'GitLab CI': ['gitlab ci', 'gitlab-ci', 'gitlab ci/cd', '.gitlab-ci.yml'],
  'GitHub Actions': ['github actions', 'gh actions', 'github workflow'],
  CircleCI: ['circleci', 'circle ci'],
  'Travis CI': ['travis ci', 'travis-ci', 'travisci'],
  ArgoCD: ['argocd', 'argo cd', 'argo-cd'],
  'Azure Pipelines': ['azure pipelines', 'azure devops pipelines'],

  // Infrastructure as Code
  Terraform: ['terraform', 'terragrunt', 'tf modules', 'hcl'],
  CloudFormation: ['cloudformation', 'cloud formation', 'cfn'],
  Ansible: ['ansible', 'ansible playbook', 'ansible tower'],
  Puppet: ['puppet', 'puppet enterprise'],
  Chef: ['chef', 'chef infra'],
  Pulumi: ['pulumi'],

  // Monitoring & Observability
  Prometheus: ['prometheus', 'prometheus metrics'],
  Grafana: ['grafana', 'grafana dashboards'],
  Datadog: ['datadog', 'datadog apm'],
  'New Relic': ['new relic', 'newrelic'],
  Splunk: ['splunk', 'splunk enterprise'],
  'ELK Stack': ['elk stack', 'elk', 'elasticsearch logstash kibana'],
  Elasticsearch: ['elasticsearch', 'elastic search'],
  Kibana: ['kibana'],
  Logstash: ['logstash'],
  Sentry: ['sentry', 'sentry.io'],
  PagerDuty: ['pagerduty', 'pager duty'],
  Jaeger: ['jaeger', 'jaeger tracing'],

  // Databases
  PostgreSQL: ['postgresql', 'postgres', 'psql', 'pg'],
  MySQL: ['mysql', 'mariadb'],
  MongoDB: ['mongodb', 'mongo', 'mongoose'],
  Redis: ['redis', 'redis cache', 'redis cluster'],
  DynamoDB: ['dynamodb', 'dynamo db', 'amazon dynamodb'],
  Cassandra: ['cassandra', 'apache cassandra'],
  Neo4j: ['neo4j', 'cypher'],
  Firebase: ['firebase', 'firestore', 'firebase realtime'],
  Supabase: ['supabase'],
  InfluxDB: ['influxdb', 'influx db'],

  // Message Queues
  'Apache Kafka': ['kafka', 'apache kafka', 'kafka streams'],
  RabbitMQ: ['rabbitmq', 'rabbit mq', 'amqp'],
  'Amazon SQS': ['sqs', 'amazon sqs', 'simple queue service'],
  'Google Pub/Sub': ['pub/sub', 'google pubsub', 'cloud pub/sub'],
  'Azure Service Bus': ['azure service bus', 'service bus'],

  // Version Control
  Git: ['git', 'git version control', 'gitflow'],
  GitHub: ['github', 'github.com', 'gh cli'],
  GitLab: ['gitlab', 'gitlab.com'],
  Bitbucket: ['bitbucket'],

  // API Tools
  Postman: ['postman', 'postman api'],
  Swagger: ['swagger', 'swagger ui', 'swagger docs'],
  OpenAPI: ['openapi', 'openapi spec', 'oas'],
  'Apollo Studio': ['apollo studio', 'apollo server'],
  GraphQL: ['graphql', 'graph ql'],

  // Design Tools
  Figma: ['figma'],
  Sketch: ['sketch', 'sketch app'],
  'Adobe XD': ['adobe xd', 'xd'],
  InVision: ['invision'],
  Zeplin: ['zeplin'],
  Storybook: ['storybook', 'chromatic'],
  Miro: ['miro', 'miro board'],

  // Project Management
  JIRA: ['jira', 'jira software', 'atlassian jira'],
  Asana: ['asana'],
  Trello: ['trello'],
  'Monday.com': ['monday.com', 'monday board'],
  Linear: ['linear', 'linear app'],
  ClickUp: ['clickup', 'click up'],
  Notion: ['notion'],
  Confluence: ['confluence', 'atlassian confluence'],

  // IDEs & Editors
  'VS Code': ['vs code', 'vscode', 'visual studio code'],
  'IntelliJ IDEA': ['intellij', 'intellij idea'],
  PyCharm: ['pycharm'],
  WebStorm: ['webstorm'],
  'Visual Studio': ['visual studio', 'vs 2022', 'vs 2019'],

  // Testing Tools
  Jest: ['jest', 'jest testing'],
  Cypress: ['cypress', 'cypress.io'],
  Playwright: ['playwright'],
  Selenium: ['selenium', 'selenium webdriver'],
  JMeter: ['jmeter', 'apache jmeter'],
  SonarQube: ['sonarqube', 'sonar'],

  // Security Tools
  Snyk: ['snyk'],
  'OWASP ZAP': ['owasp zap', 'zap proxy'],
  'Burp Suite': ['burp suite', 'burp'],
  'HashiCorp Vault': ['vault', 'hashicorp vault'],

  // Data & Analytics
  Tableau: ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  Looker: ['looker'],
  'Google Analytics': ['google analytics', 'ga4', 'analytics'],
  Mixpanel: ['mixpanel'],
  Amplitude: ['amplitude'],
  Segment: ['segment', 'segment.io'],
  'Apache Spark': ['spark', 'apache spark', 'pyspark'],
  'Apache Airflow': ['airflow', 'apache airflow'],
  dbt: ['dbt', 'data build tool'],
  Snowflake: ['snowflake'],
  Redshift: ['redshift', 'amazon redshift'],
  BigQuery: ['bigquery', 'big query'],
  Databricks: ['databricks'],

  // Communication
  Slack: ['slack'],
  'Microsoft Teams': ['microsoft teams', 'ms teams', 'teams'],
  Discord: ['discord'],
  Zoom: ['zoom'],
};

// ==================== Helper Functions ====================

/**
 * Detect tools mentioned in text
 */
export function detectToolsInText(text: string): string[] {
  const textLower = text.toLowerCase();
  const detected = new Set<string>();

  for (const [toolName, patterns] of Object.entries(TOOL_PATTERNS)) {
    for (const pattern of patterns) {
      if (textLower.includes(pattern)) {
        detected.add(toolName);
        break;
      }
    }
  }

  return Array.from(detected).sort();
}

/**
 * Get tools in a specific category
 */
export function getToolsInCategory(
  category: keyof typeof TOOL_CATEGORIES
): readonly string[] {
  return TOOL_CATEGORIES[category];
}

/**
 * Find the category for a tool
 */
export function findToolCategory(tool: string): string | null {
  for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
    if (tools.includes(tool as never)) {
      return category;
    }
  }
  return null;
}

/**
 * Normalize tool names
 */
export function normalizeTool(tool: string): string {
  const toolLower = tool.toLowerCase().trim();

  // Check if it matches any pattern
  for (const [toolName, patterns] of Object.entries(TOOL_PATTERNS)) {
    for (const pattern of patterns) {
      if (toolLower === pattern || toolLower.includes(pattern)) {
        return toolName;
      }
    }
  }

  return tool.trim();
}

/**
 * Normalize an array of tools
 */
export function normalizeTools(tools: string[]): string[] {
  const normalized = new Set<string>();
  for (const tool of tools) {
    normalized.add(normalizeTool(tool));
  }
  return Array.from(normalized).sort();
}
