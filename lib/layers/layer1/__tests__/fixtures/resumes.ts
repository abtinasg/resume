/**
 * Layer 1 - Evaluation Engine
 * Golden Test Fixtures
 *
 * Provides comprehensive test resumes covering all score ranges
 * and edge cases for validation of scoring accuracy.
 */

import type { ParsedResume, ParsedJobRequirements } from '../../types';

// ==================== Type Definitions ====================

interface GoldenResumeFixture {
  /** Unique fixture name */
  name: string;
  /** Score range this fixture represents */
  category: 'exceptional' | 'strong' | 'good' | 'fair' | 'poor' | 'edge_case';
  /** Expected overall score range */
  expected_score_range: { min: number; max: number };
  /** Expected dimension scores (approximate) */
  expected_dimensions?: {
    skill_capital?: { min: number; max: number };
    execution_impact?: { min: number; max: number };
    learning_adaptivity?: { min: number; max: number };
    signal_quality?: { min: number; max: number };
  };
  /** Expected weakness codes */
  expected_weaknesses?: string[];
  /** Expected skills to be extracted */
  expected_skills?: string[];
  /** Resume text content */
  resume_text: string;
  /** Parsed resume data (for testing scoring directly) */
  parsed_resume: ParsedResume;
}

// ==================== Exceptional Resume (90+) ====================

export const EXCEPTIONAL_SENIOR_SWE: GoldenResumeFixture = {
  name: 'exceptional_senior_swe',
  category: 'exceptional',
  expected_score_range: { min: 85, max: 100 },
  expected_dimensions: {
    skill_capital: { min: 80, max: 100 },
    execution_impact: { min: 85, max: 100 },
    learning_adaptivity: { min: 75, max: 100 },
    signal_quality: { min: 80, max: 100 },
  },
  expected_weaknesses: [],
  expected_skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Kubernetes'],
  resume_text: `
Sarah Chen
sarah.chen@email.com | (555) 123-4567 | linkedin.com/in/sarahchen | github.com/sarahc
San Francisco, CA

PROFESSIONAL SUMMARY
Principal Software Engineer with 8+ years of experience building scalable distributed systems.
Led teams of 15+ engineers at top-tier tech companies. Expertise in cloud architecture, microservices,
and performance optimization. AWS Solutions Architect and Kubernetes certified.

EXPERIENCE

Principal Software Engineer | Meta (formerly Facebook) | 2021 - Present
• Architected and deployed real-time analytics platform serving 500M+ daily active users
• Led migration of monolithic payment system to microservices, reducing latency by 75% and saving $2M annually
• Spearheaded initiative to improve code quality, resulting in 60% reduction in production incidents
• Mentored 12 engineers and established engineering best practices across 3 teams
• Designed fault-tolerant message queue handling 10M+ events per second with 99.99% uptime
• Drove adoption of TypeScript across organization, improving developer productivity by 30%

Senior Software Engineer | Google | 2018 - 2021
• Built scalable search indexing pipeline processing 1B+ documents daily using Kubernetes and Go
• Optimized database queries reducing average response time from 500ms to 50ms (10x improvement)
• Implemented machine learning-based recommendations increasing user engagement by 25%
• Led cross-functional team of 8 engineers to deliver core product features on schedule
• Reduced infrastructure costs by $500K through strategic optimization of cloud resources

Software Engineer | Stripe | 2016 - 2018
• Developed RESTful APIs handling $100M+ in daily transactions with 99.9% availability
• Implemented fraud detection system that blocked 15% more fraudulent transactions
• Built real-time dashboard for merchant analytics using React and D3.js
• Established CI/CD pipeline reducing deployment time from 4 hours to 15 minutes

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, Go, Java, SQL, GraphQL
Frontend: React, Next.js, Redux, Tailwind CSS, Webpack, Jest, Cypress
Backend: Node.js, Express, Django, FastAPI, gRPC, REST APIs, GraphQL
Database: PostgreSQL, MongoDB, Redis, DynamoDB, Elasticsearch
Cloud & DevOps: AWS (EC2, S3, Lambda, RDS, EKS), GCP, Docker, Kubernetes, Terraform
Tools: Git, GitHub Actions, Jenkins, Datadog, Splunk, New Relic, PagerDuty

CERTIFICATIONS
• AWS Solutions Architect Professional (2023)
• Kubernetes Administrator (CKA) (2022)
• Google Cloud Professional Data Engineer (2021)

EDUCATION
Master of Science, Computer Science | Stanford University | 2016
Bachelor of Science, Computer Science | UC Berkeley | 2014
`,
  parsed_resume: {
    personal: {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '(555) 123-4567',
      linkedin: 'linkedin.com/in/sarahchen',
      github: 'github.com/sarahc',
      location: 'San Francisco, CA',
    },
    experiences: [
      {
        title: 'Principal Software Engineer',
        company: 'Meta',
        location: 'Remote',
        start_date: '2021',
        end_date: 'Present',
        duration_months: 36,
        is_current: true,
        bullets: [
          'Architected and deployed real-time analytics platform serving 500M+ daily active users',
          'Led migration of monolithic payment system to microservices, reducing latency by 75% and saving $2M annually',
          'Spearheaded initiative to improve code quality, resulting in 60% reduction in production incidents',
          'Mentored 12 engineers and established engineering best practices across 3 teams',
          'Designed fault-tolerant message queue handling 10M+ events per second with 99.99% uptime',
          'Drove adoption of TypeScript across organization, improving developer productivity by 30%',
        ],
      },
      {
        title: 'Senior Software Engineer',
        company: 'Google',
        location: 'Mountain View, CA',
        start_date: '2018',
        end_date: '2021',
        duration_months: 36,
        is_current: false,
        bullets: [
          'Built scalable search indexing pipeline processing 1B+ documents daily using Kubernetes and Go',
          'Optimized database queries reducing average response time from 500ms to 50ms (10x improvement)',
          'Implemented machine learning-based recommendations increasing user engagement by 25%',
          'Led cross-functional team of 8 engineers to deliver core product features on schedule',
          'Reduced infrastructure costs by $500K through strategic optimization of cloud resources',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Stripe',
        location: 'San Francisco, CA',
        start_date: '2016',
        end_date: '2018',
        duration_months: 24,
        is_current: false,
        bullets: [
          'Developed RESTful APIs handling $100M+ in daily transactions with 99.9% availability',
          'Implemented fraud detection system that blocked 15% more fraudulent transactions',
          'Built real-time dashboard for merchant analytics using React and D3.js',
          'Established CI/CD pipeline reducing deployment time from 4 hours to 15 minutes',
        ],
      },
    ],
    education: [
      {
        degree: 'Master of Science',
        field: 'Computer Science',
        institution: 'Stanford University',
        graduation_year: 2016,
      },
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'UC Berkeley',
        graduation_year: 2014,
      },
    ],
    skills: [
      'TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'SQL', 'GraphQL',
      'React', 'Next.js', 'Redux', 'Tailwind CSS', 'Webpack', 'Jest', 'Cypress',
      'Node.js', 'Express', 'Django', 'FastAPI', 'gRPC', 'REST APIs',
      'PostgreSQL', 'MongoDB', 'Redis', 'DynamoDB', 'Elasticsearch',
      'AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
      'Git', 'GitHub Actions', 'Jenkins', 'Datadog',
    ],
    certifications: [
      { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', year: 2023 },
      { name: 'Kubernetes Administrator (CKA)', issuer: 'CNCF', year: 2022 },
      { name: 'Google Cloud Professional Data Engineer', issuer: 'Google', year: 2021 },
    ],
    metadata: {
      page_count: 2,
      word_count: 580,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'high',
    },
  },
};

// ==================== Strong Resume (75-89) ====================

export const STRONG_MID_LEVEL_PM: GoldenResumeFixture = {
  name: 'strong_mid_level_pm',
  category: 'strong',
  expected_score_range: { min: 72, max: 85 },
  expected_dimensions: {
    skill_capital: { min: 70, max: 90 },
    execution_impact: { min: 70, max: 85 },
    learning_adaptivity: { min: 60, max: 80 },
    signal_quality: { min: 70, max: 90 },
  },
  expected_weaknesses: [],
  expected_skills: ['Product Management', 'Agile', 'JIRA', 'SQL', 'Data Analysis'],
  resume_text: `
Michael Johnson
michael.johnson@email.com | (555) 987-6543 | linkedin.com/in/mjohnson
New York, NY

SUMMARY
Product Manager with 4 years of experience delivering B2B SaaS products. Strong track record of
data-driven decision making and cross-functional collaboration. Passionate about building products
that solve real customer problems.

EXPERIENCE

Senior Product Manager | DataTech Inc. | 2022 - Present
• Led product strategy for enterprise analytics platform generating $5M ARR
• Increased monthly active users by 40% through redesigned onboarding experience
• Conducted 50+ customer interviews to identify key pain points and feature opportunities
• Collaborated with engineering team of 6 to deliver 3 major releases per quarter
• Implemented A/B testing framework that improved conversion rate by 25%

Product Manager | StartupCo | 2020 - 2022
• Managed product roadmap for mobile app with 100K+ users
• Reduced customer churn by 20% through targeted feature improvements
• Worked with design team to create intuitive user experiences
• Wrote detailed PRDs and user stories for engineering handoff
• Established KPI tracking dashboard using Mixpanel and Tableau

Associate Product Manager | TechCorp | 2019 - 2020
• Assisted senior PM in managing product backlog and sprint planning
• Analyzed user data to inform product decisions
• Coordinated with QA team on feature testing and bug tracking

SKILLS
Product: Roadmap Planning, User Research, A/B Testing, PRD Writing, Wireframing
Analytics: SQL, Google Analytics, Mixpanel, Amplitude, Tableau
Methodology: Agile, Scrum, Design Thinking, Lean Startup
Tools: JIRA, Confluence, Figma, Notion, Slack

EDUCATION
Bachelor of Arts, Economics | NYU | 2019
`,
  parsed_resume: {
    personal: {
      name: 'Michael Johnson',
      email: 'michael.johnson@email.com',
      phone: '(555) 987-6543',
      linkedin: 'linkedin.com/in/mjohnson',
      location: 'New York, NY',
    },
    experiences: [
      {
        title: 'Senior Product Manager',
        company: 'DataTech Inc.',
        start_date: '2022',
        end_date: 'Present',
        duration_months: 24,
        is_current: true,
        bullets: [
          'Led product strategy for enterprise analytics platform generating $5M ARR',
          'Increased monthly active users by 40% through redesigned onboarding experience',
          'Conducted 50+ customer interviews to identify key pain points and feature opportunities',
          'Collaborated with engineering team of 6 to deliver 3 major releases per quarter',
          'Implemented A/B testing framework that improved conversion rate by 25%',
        ],
      },
      {
        title: 'Product Manager',
        company: 'StartupCo',
        start_date: '2020',
        end_date: '2022',
        duration_months: 24,
        is_current: false,
        bullets: [
          'Managed product roadmap for mobile app with 100K+ users',
          'Reduced customer churn by 20% through targeted feature improvements',
          'Worked with design team to create intuitive user experiences',
          'Wrote detailed PRDs and user stories for engineering handoff',
          'Established KPI tracking dashboard using Mixpanel and Tableau',
        ],
      },
      {
        title: 'Associate Product Manager',
        company: 'TechCorp',
        start_date: '2019',
        end_date: '2020',
        duration_months: 12,
        is_current: false,
        bullets: [
          'Assisted senior PM in managing product backlog and sprint planning',
          'Analyzed user data to inform product decisions',
          'Coordinated with QA team on feature testing and bug tracking',
        ],
      },
    ],
    education: [
      {
        degree: 'Bachelor of Arts',
        field: 'Economics',
        institution: 'NYU',
        graduation_year: 2019,
      },
    ],
    skills: [
      'Roadmap Planning', 'User Research', 'A/B Testing', 'PRD Writing', 'Wireframing',
      'SQL', 'Google Analytics', 'Mixpanel', 'Amplitude', 'Tableau',
      'Agile', 'Scrum', 'Design Thinking',
      'JIRA', 'Confluence', 'Figma', 'Notion',
    ],
    metadata: {
      page_count: 1,
      word_count: 380,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'high',
    },
  },
};

// ==================== Good Resume (60-74) ====================

export const GOOD_ENTRY_LEVEL_DEV: GoldenResumeFixture = {
  name: 'good_entry_level_dev',
  category: 'good',
  expected_score_range: { min: 55, max: 72 },
  expected_dimensions: {
    skill_capital: { min: 55, max: 75 },
    execution_impact: { min: 50, max: 70 },
    learning_adaptivity: { min: 50, max: 70 },
    signal_quality: { min: 60, max: 80 },
  },
  expected_weaknesses: ['few_skills_listed'],
  expected_skills: ['JavaScript', 'React', 'Python'],
  resume_text: `
Emily Davis
emily.davis@email.com | (555) 555-1234
Austin, TX

OBJECTIVE
Recent computer science graduate seeking entry-level software development position.
Eager to apply my programming skills and learn from experienced developers.

EXPERIENCE

Software Developer Intern | TechStartup | Summer 2023
• Built front-end features using React and JavaScript
• Fixed bugs and improved code quality
• Participated in daily standups and sprint planning
• Learned about agile development practices

Teaching Assistant | University of Texas | 2022 - 2023
• Helped students with programming assignments in Python
• Held office hours and graded homework
• Assisted professor with course materials

PROJECTS

Personal Portfolio Website
• Created responsive website using React and CSS
• Deployed on GitHub Pages

Task Manager App
• Built full-stack application with Node.js and MongoDB
• Implemented user authentication

SKILLS
JavaScript, React, Python, Node.js, HTML, CSS, Git

EDUCATION
Bachelor of Science, Computer Science | University of Texas | 2023
GPA: 3.5
`,
  parsed_resume: {
    personal: {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '(555) 555-1234',
      location: 'Austin, TX',
    },
    experiences: [
      {
        title: 'Software Developer Intern',
        company: 'TechStartup',
        start_date: 'Summer 2023',
        end_date: '2023',
        duration_months: 3,
        is_current: false,
        bullets: [
          'Built front-end features using React and JavaScript',
          'Fixed bugs and improved code quality',
          'Participated in daily standups and sprint planning',
          'Learned about agile development practices',
        ],
      },
      {
        title: 'Teaching Assistant',
        company: 'University of Texas',
        start_date: '2022',
        end_date: '2023',
        duration_months: 12,
        is_current: false,
        bullets: [
          'Helped students with programming assignments in Python',
          'Held office hours and graded homework',
          'Assisted professor with course materials',
        ],
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University of Texas',
        graduation_year: 2023,
        gpa: 3.5,
      },
    ],
    skills: [
      'JavaScript', 'React', 'Python', 'Node.js', 'HTML', 'CSS', 'Git',
    ],
    projects: [
      {
        name: 'Personal Portfolio Website',
        description: 'Created responsive website using React and CSS. Deployed on GitHub Pages.',
        technologies: ['React', 'CSS', 'GitHub Pages'],
      },
      {
        name: 'Task Manager App',
        description: 'Built full-stack application with Node.js and MongoDB. Implemented user authentication.',
        technologies: ['Node.js', 'MongoDB'],
      },
    ],
    metadata: {
      page_count: 1,
      word_count: 250,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'high',
    },
  },
};

// ==================== Fair Resume (45-59) ====================

export const FAIR_WEAK_CONTENT: GoldenResumeFixture = {
  name: 'fair_weak_content',
  category: 'fair',
  expected_score_range: { min: 40, max: 58 },
  expected_dimensions: {
    skill_capital: { min: 35, max: 55 },
    execution_impact: { min: 30, max: 50 },
    learning_adaptivity: { min: 30, max: 50 },
    signal_quality: { min: 45, max: 65 },
  },
  expected_weaknesses: ['weak_verbs', 'no_metrics', 'generic_descriptions'],
  expected_skills: [],
  resume_text: `
John Smith
johnsmith@email.com

Work Experience

Developer at Company XYZ (2021-2023)
- Worked on various projects
- Responsible for fixing bugs
- Helped the team with tasks
- Participated in meetings
- Involved in code reviews

IT Support at Company ABC (2019-2021)
- Assisted users with technical issues
- Was responsible for maintaining systems
- Helped with software installations
- Participated in IT projects

Skills
Problem solving, communication, teamwork, computers

Education
Bachelor's Degree, 2019
`,
  parsed_resume: {
    personal: {
      name: 'John Smith',
      email: 'johnsmith@email.com',
    },
    experiences: [
      {
        title: 'Developer',
        company: 'Company XYZ',
        start_date: '2021',
        end_date: '2023',
        duration_months: 24,
        is_current: false,
        bullets: [
          'Worked on various projects',
          'Responsible for fixing bugs',
          'Helped the team with tasks',
          'Participated in meetings',
          'Involved in code reviews',
        ],
      },
      {
        title: 'IT Support',
        company: 'Company ABC',
        start_date: '2019',
        end_date: '2021',
        duration_months: 24,
        is_current: false,
        bullets: [
          'Assisted users with technical issues',
          'Was responsible for maintaining systems',
          'Helped with software installations',
          'Participated in IT projects',
        ],
      },
    ],
    education: [
      {
        degree: "Bachelor's Degree",
        institution: 'Unknown',
        graduation_year: 2019,
      },
    ],
    skills: [
      'Problem solving', 'communication', 'teamwork', 'computers',
    ],
    metadata: {
      page_count: 1,
      word_count: 120,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'medium',
    },
  },
};

// ==================== Poor Resume (<45) ====================

export const POOR_MINIMAL: GoldenResumeFixture = {
  name: 'poor_minimal',
  category: 'poor',
  expected_score_range: { min: 20, max: 45 },
  expected_dimensions: {
    skill_capital: { min: 15, max: 35 },
    execution_impact: { min: 15, max: 35 },
    learning_adaptivity: { min: 10, max: 30 },
    signal_quality: { min: 20, max: 40 },
  },
  expected_weaknesses: ['too_short', 'no_metrics', 'weak_verbs', 'few_skills_listed'],
  expected_skills: [],
  resume_text: `
Jane Doe
jane@email.com

I am looking for a job in technology. I have some experience with computers
and I am a fast learner. I can work well with others and I am reliable.

Previous Job:
Did computer work at a company for 2 years.
`,
  parsed_resume: {
    personal: {
      name: 'Jane Doe',
      email: 'jane@email.com',
    },
    experiences: [
      {
        title: 'Unknown',
        company: 'a company',
        start_date: 'Unknown',
        end_date: 'Unknown',
        duration_months: 24,
        is_current: false,
        bullets: [
          'Did computer work at a company for 2 years',
        ],
      },
    ],
    education: [],
    skills: [],
    metadata: {
      page_count: 1,
      word_count: 60,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'low',
    },
  },
};

// ==================== Edge Case: No Experience ====================

export const EDGE_NO_EXPERIENCE: GoldenResumeFixture = {
  name: 'edge_no_experience',
  category: 'edge_case',
  expected_score_range: { min: 25, max: 50 },
  expected_weaknesses: ['no_experience'],
  expected_skills: ['Python', 'JavaScript', 'Machine Learning'],
  resume_text: `
Alex Thompson
alex.thompson@email.com | github.com/alexthompson

SKILLS
Python, JavaScript, React, Machine Learning, TensorFlow, SQL, Git

PROJECTS

ML Image Classifier
• Built image classification model using TensorFlow with 95% accuracy
• Deployed model as REST API using Flask

E-Commerce Website
• Created full-stack web application using React and Node.js
• Implemented payment integration with Stripe

EDUCATION
Bachelor of Science, Computer Science | MIT | 2024
GPA: 3.9

CERTIFICATIONS
• AWS Cloud Practitioner
• Google Data Analytics Certificate
`,
  parsed_resume: {
    personal: {
      name: 'Alex Thompson',
      email: 'alex.thompson@email.com',
      github: 'github.com/alexthompson',
    },
    experiences: [],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'MIT',
        graduation_year: 2024,
        gpa: 3.9,
      },
    ],
    skills: [
      'Python', 'JavaScript', 'React', 'Machine Learning', 'TensorFlow', 'SQL', 'Git',
    ],
    projects: [
      {
        name: 'ML Image Classifier',
        description: 'Built image classification model using TensorFlow with 95% accuracy. Deployed as REST API.',
        technologies: ['TensorFlow', 'Flask', 'Python'],
      },
      {
        name: 'E-Commerce Website',
        description: 'Full-stack web application with payment integration.',
        technologies: ['React', 'Node.js', 'Stripe'],
      },
    ],
    certifications: [
      { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services' },
      { name: 'Google Data Analytics Certificate', issuer: 'Google' },
    ],
    metadata: {
      page_count: 1,
      word_count: 150,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'high',
    },
  },
};

// ==================== Edge Case: Very Short ====================

export const EDGE_VERY_SHORT: GoldenResumeFixture = {
  name: 'edge_very_short',
  category: 'edge_case',
  expected_score_range: { min: 15, max: 35 },
  expected_weaknesses: ['too_short'],
  expected_skills: [],
  resume_text: `
Bob Johnson
bob@email.com

Software Developer with 3 years experience. Python, JavaScript.
`,
  parsed_resume: {
    personal: {
      name: 'Bob Johnson',
      email: 'bob@email.com',
    },
    experiences: [],
    education: [],
    skills: ['Python', 'JavaScript'],
    metadata: {
      page_count: 1,
      word_count: 15,
      has_tables: false,
      has_images: false,
      format: 'txt',
      parse_quality: 'low',
    },
  },
};

// ==================== Job Description Fixtures ====================

export const JOB_SENIOR_SWE: ParsedJobRequirements = {
  required_skills: [
    'TypeScript', 'React', 'Node.js', 'AWS', 'Kubernetes',
    'PostgreSQL', 'REST APIs', 'Microservices',
  ],
  preferred_skills: [
    'GraphQL', 'Redis', 'Terraform', 'Python',
  ],
  required_tools: [
    'Docker', 'GitHub', 'Jenkins', 'JIRA',
  ],
  preferred_tools: [
    'Datadog', 'Prometheus', 'Grafana',
  ],
  seniority_expected: 'senior',
  domain_keywords: ['scalable', 'distributed', 'cloud', 'enterprise'],
  years_experience_min: 5,
  years_experience_max: 10,
};

export const JOB_PRODUCT_MANAGER: ParsedJobRequirements = {
  required_skills: [
    'Product Management', 'Roadmap Planning', 'User Research',
    'A/B Testing', 'Data Analysis', 'Agile',
  ],
  preferred_skills: [
    'SQL', 'Wireframing', 'Technical Understanding',
  ],
  required_tools: [
    'JIRA', 'Confluence', 'Figma',
  ],
  preferred_tools: [
    'Mixpanel', 'Amplitude', 'Tableau',
  ],
  seniority_expected: 'mid',
  domain_keywords: ['saas', 'b2b', 'analytics', 'enterprise'],
  years_experience_min: 3,
  years_experience_max: 6,
};

export const JOB_ENTRY_DEVELOPER: ParsedJobRequirements = {
  required_skills: [
    'JavaScript', 'HTML', 'CSS', 'Git',
  ],
  preferred_skills: [
    'React', 'Node.js', 'Python', 'TypeScript',
  ],
  required_tools: [
    'Git', 'VS Code',
  ],
  seniority_expected: 'entry',
  years_experience_min: 0,
  years_experience_max: 2,
};

// ==================== All Fixtures Export ====================

export const GOLDEN_RESUMES: GoldenResumeFixture[] = [
  EXCEPTIONAL_SENIOR_SWE,
  STRONG_MID_LEVEL_PM,
  GOOD_ENTRY_LEVEL_DEV,
  FAIR_WEAK_CONTENT,
  POOR_MINIMAL,
  EDGE_NO_EXPERIENCE,
  EDGE_VERY_SHORT,
];

export const JOB_FIXTURES = {
  senior_swe: JOB_SENIOR_SWE,
  product_manager: JOB_PRODUCT_MANAGER,
  entry_developer: JOB_ENTRY_DEVELOPER,
};
