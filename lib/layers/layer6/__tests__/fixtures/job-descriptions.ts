/**
 * Layer 6 - Job Discovery & Matching Module
 * Test Fixtures - Job Descriptions
 *
 * Contains realistic job descriptions for testing parsing, ranking, and comparison.
 */

// ==================== Test Job Descriptions ====================

/**
 * Fixture 1: Software Engineer - Target (mid-level fit)
 * Good match for typical mid-level engineer
 */
export const JOB_SOFTWARE_ENGINEER_TARGET = {
  name: 'Software Engineer - Target',
  category_expected: 'target' as const,
  job_description: `
Software Engineer
Company: TechStartup Inc.
Location: San Francisco, CA (Hybrid)

About the Role:
We're looking for a talented Software Engineer to join our growing team. You'll work on building and maintaining our core platform features.

Responsibilities:
• Design, develop, and maintain scalable web applications
• Collaborate with cross-functional teams to define and implement new features
• Write clean, maintainable, and well-tested code
• Participate in code reviews and mentor junior developers
• Troubleshoot and resolve production issues

Requirements:
• 3-5 years of professional software development experience
• Strong proficiency in JavaScript/TypeScript and React
• Experience with Node.js and REST APIs
• Familiarity with SQL databases (PostgreSQL preferred)
• Experience with Git and CI/CD pipelines
• Strong problem-solving skills

Nice to Have:
• Experience with AWS services
• Familiarity with Docker and Kubernetes
• Knowledge of GraphQL

Benefits:
• Competitive salary ($130,000 - $160,000)
• Health, dental, and vision insurance
• 401(k) matching
• Flexible PTO
• Remote work options

Posted: 3 days ago
Apply by: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
`.trim(),
  metadata: {
    job_title: 'Software Engineer',
    company: 'TechStartup Inc.',
    job_url: 'https://techstartup.com/careers/software-engineer',
    location: 'San Francisco, CA',
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Software Engineer',
    company: 'TechStartup Inc.',
    location: 'San Francisco, CA',
    work_arrangement: 'hybrid',
    seniority: 'mid',
    min_skills_extracted: 4,
    min_responsibilities: 3,
    parse_quality: 'high',
  },
};

/**
 * Fixture 2: Senior Engineer - Reach (stretch opportunity)
 * More senior role with higher requirements
 */
export const JOB_SENIOR_ENGINEER_REACH = {
  name: 'Senior Software Engineer - Reach',
  category_expected: 'reach' as const,
  job_description: `
Senior Software Engineer - Platform Team
Stripe
San Francisco, CA / Remote

About Stripe:
Stripe is a financial infrastructure platform for businesses. Millions of companies use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

About the Role:
We're looking for a Senior Software Engineer to join our Platform team. You'll work on critical infrastructure that powers payments for millions of businesses worldwide.

What You'll Do:
• Design and implement highly available, scalable distributed systems
• Lead technical projects from conception to production
• Mentor engineers and set technical direction for the team
• Collaborate with Product and Design to build excellent user experiences
• Participate in on-call rotations and incident response
• Drive improvements to engineering practices and processes

Minimum Requirements:
• 5+ years of professional software engineering experience
• Expert-level proficiency in at least one backend language (Java, Ruby, Python, or Go)
• Deep experience with distributed systems and microservices architecture
• Strong understanding of database design and optimization
• Experience leading technical projects and mentoring engineers
• Track record of shipping high-quality software at scale

Preferred Qualifications:
• Experience with payment systems or financial technology
• Familiarity with Kubernetes, Terraform, and cloud infrastructure
• Experience with real-time data processing (Kafka, Spark)
• Open source contributions
• Published technical writing or speaking at conferences

Compensation:
$200,000 - $280,000 base salary + equity

Application Deadline: ${new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
`.trim(),
  metadata: {
    job_title: 'Senior Software Engineer',
    company: 'Stripe',
    job_url: 'https://stripe.com/jobs/senior-swe-platform',
    location: 'San Francisco, CA',
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Senior Software Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    work_arrangement: 'remote',
    seniority: 'senior',
    min_skills_extracted: 5,
    min_responsibilities: 4,
    parse_quality: 'high',
  },
};

/**
 * Fixture 3: Junior Developer - Safety (easy to get)
 * Entry-level role with fewer requirements
 */
export const JOB_JUNIOR_DEVELOPER_SAFETY = {
  name: 'Junior Developer - Safety',
  category_expected: 'safety' as const,
  job_description: `
Junior Web Developer
StartupXYZ | Remote (US)

Join Our Team!
StartupXYZ is looking for a Junior Web Developer to help build our next-generation web applications. This is a great opportunity for recent graduates or career changers.

What You'll Do:
• Develop and maintain web applications using modern frameworks
• Work closely with senior developers to learn best practices
• Fix bugs and implement small features
• Write documentation and tests
• Participate in daily standups and team meetings

Requirements:
• Bachelor's degree in Computer Science or equivalent experience
• 0-2 years of experience in web development
• Basic knowledge of HTML, CSS, and JavaScript
• Familiarity with React or similar frameworks is a plus
• Strong desire to learn and grow
• Good communication skills

What We Offer:
• Competitive salary ($70,000 - $90,000)
• Fully remote position
• Mentorship program
• Professional development budget
• Health insurance

No prior professional experience required - just enthusiasm and willingness to learn!

Posted: Today
`.trim(),
  metadata: {
    job_title: 'Junior Web Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Junior Web Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    work_arrangement: 'remote',
    seniority: 'entry',
    min_skills_extracted: 3,
    parse_quality: 'high',
  },
};

/**
 * Fixture 4: Poor Fit - Avoid (low match)
 * Role in different domain with mismatched requirements
 */
export const JOB_POOR_FIT_AVOID = {
  name: 'Data Scientist - Avoid (Poor Fit)',
  category_expected: 'avoid' as const,
  job_description: `
Senior Data Scientist - Machine Learning
BioTech Corp | Boston, MA (On-site only)

About the Role:
We're seeking an experienced Data Scientist to lead our ML initiatives in drug discovery. You'll work with our research team to develop predictive models for pharmaceutical applications.

Requirements:
• PhD in Statistics, Mathematics, or Computational Biology
• 7+ years of experience in data science
• Expert-level Python with scikit-learn, TensorFlow, PyTorch
• Deep knowledge of statistical modeling and experimental design
• Experience with genomics data (RNA-seq, GWAS)
• Publication record in peer-reviewed journals
• Experience with FDA regulatory requirements

Key Responsibilities:
• Develop ML models for drug target identification
• Analyze large-scale genomics datasets
• Collaborate with wet lab scientists
• Present findings to executive leadership
• Lead a team of 3-5 data scientists

Compensation: $180,000 - $240,000 + Bonus

This is an on-site position. Candidates must be located in or willing to relocate to Boston.
`.trim(),
  metadata: {
    job_title: 'Senior Data Scientist',
    company: 'BioTech Corp',
    location: 'Boston, MA',
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Senior Data Scientist',
    company: 'BioTech Corp',
    location: 'Boston, MA',
    work_arrangement: 'onsite',
    seniority: 'senior',
    min_skills_extracted: 4,
    parse_quality: 'high',
  },
};

/**
 * Fixture 5: Scam Job (high scam_risk)
 * Contains multiple red flags
 */
export const JOB_SCAM = {
  name: 'Scam Job',
  category_expected: 'avoid' as const,
  is_scam: true,
  job_description: `
WORK FROM HOME - EASY MONEY!!!

UNLIMITED EARNING POTENTIAL! BE YOUR OWN BOSS!

Hi there!

We are looking for motivated individuals who want to WORK FROM HOME and earn $5000-$10000 per week!

NO EXPERIENCE NEEDED! We provide full training!

This is NOT a job - it's a LIFESTYLE!

Requirements:
- Must be 18+
- Have a computer and internet
- Be motivated!

That's it! Anyone can do this!

What you'll get:
• GUARANTEED INCOME of $500/day minimum
• Work whenever you want
• No boss!
• Passive income opportunity

To get started, just send us your:
- Full name
- Phone number
- Bank account for direct deposit
- Social security number (for tax purposes)

ACT NOW! Limited spots available!

Investment opportunity - small startup fee of $299 required.

Don't miss this chance to achieve FINANCIAL FREEDOM!

Reply today!
`.trim(),
  metadata: {
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Unknown Position',
    company: 'Unknown Company',
    parse_quality: 'low',
    scam_risk: 'high',
  },
};

/**
 * Fixture 6: Incomplete JD (low parse_quality)
 * Minimal information, hard to parse
 */
export const JOB_INCOMPLETE = {
  name: 'Incomplete Job Description',
  category_expected: 'avoid' as const,
  job_description: `
Developer needed.

Good salary.

Contact us at jobs@example.com
`.trim(),
  metadata: {
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Developer',
    company: 'Unknown Company',
    parse_quality: 'low',
    min_skills_extracted: 0,
  },
};

/**
 * Fixture 7: Full Stack Engineer - Target with good career capital
 */
export const JOB_FULLSTACK_GOOGLE = {
  name: 'Full Stack Engineer - Google',
  category_expected: 'target' as const,
  job_description: `
Software Engineer, Full Stack - Google Cloud
Google | Mountain View, CA

Minimum Qualifications:
• Bachelor's degree in Computer Science or equivalent practical experience
• 4+ years of experience in software development
• Experience with one or more general purpose programming languages including: Java, C/C++, Python, Go, or JavaScript/TypeScript

Preferred Qualifications:
• Experience building and developing large-scale infrastructure, distributed systems or networks
• Experience with Angular, React, or similar frontend frameworks
• Knowledge of cloud technologies (GCP, AWS, Azure)
• Experience with databases (SQL and NoSQL)

About the Job:
Google Cloud accelerates every organization's ability to digitally transform its business. We deliver enterprise-grade solutions that leverage Google's cutting-edge technology.

Responsibilities:
• Design, develop, test, deploy, maintain, and enhance software
• Manage individual project priorities and deadlines
• Work with Product and UX teams to develop new features
• Review code developed by other engineers
• Mentor and coach junior engineers

Salary Range: $160,000 - $220,000 + bonus + equity + benefits
Location: Mountain View, CA (Hybrid - 3 days in office)

Google is proud to be an equal opportunity workplace.
`.trim(),
  metadata: {
    job_title: 'Software Engineer, Full Stack',
    company: 'Google',
    job_url: 'https://careers.google.com/jobs/results/12345',
    location: 'Mountain View, CA',
    source: 'manual_paste' as const,
  },
  expected_parse: {
    job_title: 'Software Engineer, Full Stack',
    company: 'Google',
    location: 'Mountain View, CA',
    work_arrangement: 'hybrid',
    seniority: 'mid',
    min_skills_extracted: 5,
    parse_quality: 'high',
    company_tier: 'top_tier',
  },
};

// ==================== Test Data Arrays ====================

/**
 * All job fixtures
 */
export const ALL_JOB_FIXTURES = [
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_JUNIOR_DEVELOPER_SAFETY,
  JOB_POOR_FIT_AVOID,
  JOB_SCAM,
  JOB_INCOMPLETE,
  JOB_FULLSTACK_GOOGLE,
];

/**
 * Valid job fixtures (excluding scam and incomplete)
 */
export const VALID_JOB_FIXTURES = [
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_JUNIOR_DEVELOPER_SAFETY,
  JOB_POOR_FIT_AVOID,
  JOB_FULLSTACK_GOOGLE,
];

/**
 * Jobs for comparison tests
 */
export const COMPARISON_TEST_JOBS = [
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_FULLSTACK_GOOGLE,
];

// ==================== Test Resume Text ====================

/**
 * Sample resume text for mid-level software engineer
 */
export const TEST_RESUME_TEXT = `
John Smith
Software Engineer
john.smith@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johnsmith | GitHub: github.com/johnsmith

SUMMARY
Experienced software engineer with 4 years of experience building scalable web applications. 
Passionate about clean code, testing, and collaborative development.

EXPERIENCE

Software Engineer | TechCorp Inc. | Jan 2021 - Present
• Developed and maintained React-based web applications serving 100K+ users
• Built RESTful APIs using Node.js and Express, reducing response times by 40%
• Implemented CI/CD pipelines with GitHub Actions, increasing deployment frequency by 3x
• Mentored 2 junior developers, conducting code reviews and pair programming sessions
• Led migration from monolithic architecture to microservices, improving scalability

Junior Developer | StartupABC | Jun 2019 - Dec 2020
• Built responsive web interfaces using React and TypeScript
• Collaborated with product team to implement new features
• Wrote unit and integration tests achieving 80% code coverage
• Participated in agile ceremonies and sprint planning

SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React, Next.js, HTML, CSS, Tailwind
Backend: Node.js, Express, PostgreSQL, MongoDB
Tools: Git, Docker, AWS, GitHub Actions, Jest

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2019
`.trim();

/**
 * User preferences for testing
 */
export const TEST_USER_PREFERENCES = {
  work_arrangement: ['remote', 'hybrid'] as const,
  locations: ['San Francisco', 'Remote'],
  salary_minimum: 100000,
  excluded_industries: ['gambling', 'tobacco'],
};

/**
 * User skills extracted from resume
 */
export const TEST_USER_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'SQL',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'PostgreSQL',
  'MongoDB',
  'Git',
  'Docker',
  'AWS',
  'GitHub Actions',
  'Jest',
];
