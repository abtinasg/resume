# 🚀 ResumeIQ Website Redesign - Execution Plan (Claude Build Ready)

**Document Version**: 1.0
**Created**: November 12, 2025
**Branch**: `claude/resumeiq-redesign-roadmap-011CV4HLGPnhhG6J27ytLzUk`
**Status**: Ready for Implementation
**Timeline**: 8 Weeks (MVP-First Delivery)

---

## 📋 Executive Summary

This document provides a complete, actionable implementation roadmap for the ResumeIQ website redesign, extracted from the Website Redesign Goals v1.0 and Analysis documents. All tasks are organized by domain, prioritized, and ready for GitHub Projects or Notion import.

**Key Deliverables**:
- 6 Strategic Goals → 98 Actionable Tasks
- 8-Week Implementation Timeline with Milestones
- Code-Ready Task List for Claude Code Automation
- Tech Stack: Next.js 14, Tailwind CSS, TypeScript, Prisma, PostgreSQL, NextAuth

**Expected Outcomes** (8 weeks):
- ✅ +25% upload-to-analyze conversion rate
- ✅ +40% post-analysis registration rate
- ✅ +50% methodology page visits
- ✅ Reduce mobile/desktop conversion gap from 45% → 30%
- ✅ 45% AI Coach engagement rate
- ✅ Premium tier infrastructure ready

---

## 📊 Table of Contents

1. [Task Breakdown by Domain](#task-breakdown-by-domain)
   - [Frontend/Next.js](#1-frontendnextjs)
   - [Backend/API](#2-backendapi)
   - [Analytics/Tracking](#3-analyticstracking)
   - [Design/UI](#4-designui)
   - [Content/SEO](#5-contentseo)
   - [Growth/Marketing](#6-growthmarketing)
2. [Code Setup Tasks](#code-setup-tasks)
3. [8-Week Timeline & Milestones](#8-week-timeline--milestones)
4. [Claude Code Automation Task List](#claude-code-automation-task-list)
5. [Success Metrics & KPIs](#success-metrics--kpis)

---

## Task Breakdown by Domain

### 1. Frontend/Next.js

#### **Phase 1: Foundation (Weeks 1-2)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| F001 | Optimize Hero CTA Copy | Change "Start your free analysis" to "Get My Free Resume Score" with benefit subtext | **P0** | Low (1d) | None | `app/page.tsx:189-196` |
| F002 | Add Trust Signals to CTAs | Add "No credit card • Private • 6-min results" badges below all primary CTAs | **P0** | Low (1d) | None | `components/TrustBadges.tsx` |
| F003 | Implement Sticky Mobile CTA | Create sticky bottom CTA that appears after scrolling past hero on mobile | **P0** | Medium (3d) | None | `components/MobileCTA.tsx` |
| F004 | Optimize Font Loading | Migrate from Google Fonts CDN to `next/font` for automatic optimization | **P0** | Low (1d) | None | `app/layout.tsx:19-24` |
| F005 | Improve SEO Metadata | Update title, description, keywords, Open Graph, Twitter Card metadata | **P0** | Low (1d) | None | `app/layout.tsx:6-9` |
| F006 | Add Social Proof Section | Create testimonials section with photos, job titles, and success metrics | **P1** | Medium (3d) | Design assets | `components/TestimonialsSection.tsx` |
| F007 | Create Exit Intent Modal | Implement exit-intent popup for abandoning visitors | **P1** | Medium (3d) | None | `components/ExitIntentModal.tsx` |
| F008 | Enhance Upload Flow | Add progress indicators, instant preview, drag-and-drop improvements | **P0** | Medium (3d) | None | `components/UploadSection.tsx` |

#### **Phase 2: Engagement (Weeks 3-4)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| F009 | Enhance Registration Modal | Create value-driven registration prompt with benefits list post-analysis | **P0** | Medium (3d) | None | `components/RegistrationModal.tsx` |
| F010 | Build Dashboard Progress Tracking | Add score improvement timeline, visual charts, milestone celebrations | **P0** | High (5d+) | Backend API | `app/dashboard/page.tsx` |
| F011 | Implement Resume Version Comparison | Side-by-side comparison view of different resume versions | **P1** | High (5d+) | Backend API | `components/ComparisonView.tsx` |
| F012 | Add Achievement Badge System | Gamification with badges for milestones (first analysis, 90+ score, etc.) | **P2** | High (5d+) | Backend API | `components/AchievementBadges.tsx` |
| F013 | Implement Social Login | One-click Google OAuth authentication | **P1** | Medium (3d) | NextAuth config | `app/auth/` |

#### **Phase 3: Authority (Weeks 5-6)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| F014 | Create Methodology Page | Dedicated page explaining scoring algorithm with interactive elements | **P0** | Medium (3d) | Content | `app/methodology/page.tsx` |
| F015 | Build Content Hub (/insights) | Blog infrastructure with category filtering, search, pagination | **P1** | High (5d+) | CMS setup | `app/insights/page.tsx` |
| F016 | Create Interactive Scoring Demo | Calculator showing how different improvements affect score | **P1** | High (5d+) | None | `components/ScoringCalculator.tsx` |
| F017 | Add Structured Data (Schema.org) | Implement JSON-LD for WebApplication, Organization, FAQPage schemas | **P0** | Low (1d) | None | `app/layout.tsx` |
| F018 | Generate Sitemap & Robots | Create dynamic sitemap.xml and robots.txt using Next.js | **P0** | Low (1d) | None | `app/sitemap.ts`, `app/robots.ts` |
| F019 | Add Breadcrumb Navigation | Implement breadcrumbs for deep pages (insights, methodology) | **P1** | Low (1d) | None | `components/Breadcrumbs.tsx` |

#### **Phase 4: Scale (Weeks 7-8)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| F020 | Mobile Performance Optimization | Lazy loading, code splitting, mobile-specific CSS, reduced animations | **P0** | High (5d+) | None | `next.config.js`, various components |
| F021 | Add Mobile Camera Capture | Allow users to photograph physical resumes on mobile devices | **P0** | Medium (3d) | None | `components/UploadSection.tsx` |
| F022 | Create Pricing Page | Three-tier pricing with comparison table and FAQ | **P0** | Medium (3d) | Design | `app/pricing/page.tsx` |
| F023 | Build Premium Feature UI | Add "PRO" badges, upgrade CTAs, feature gating for premium users | **P0** | High (5d+) | Backend API | `components/PremiumBadge.tsx` |
| F024 | Implement A/B Testing Framework | Setup Vercel Edge Config or similar for feature flags | **P2** | High (5d+) | None | `lib/abtest.ts` |
| F025 | Add Competitor Comparison Table | Feature comparison: ResumeIQ vs Resume Worded, Jobscan, Rezi | **P1** | Low (1d) | Content | `components/ComparisonTable.tsx` |
| F026 | Create How It Works Page | Step-by-step guide with visuals showing the analysis process | **P1** | Medium (3d) | Design assets | `app/how-it-works/page.tsx` |

---

### 2. Backend/API

#### **Phase 1: Foundation (Weeks 1-2)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| B001 | Implement Exit Survey API | Create endpoint to collect user feedback on exit | **P1** | Low (1d) | None | `app/api/feedback/route.ts` |
| B002 | Add Analytics Event Tracking | Backend logging for key events (upload, analysis, registration) | **P0** | Low (1d) | None | `lib/analytics.ts` |

#### **Phase 2: Engagement (Weeks 3-4)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| B003 | Build Progress Tracking API | Endpoints for resume version history and score improvements over time | **P0** | Medium (3d) | Prisma schema | `app/api/progress/route.ts` |
| B004 | Implement Email Service | Send welcome emails, re-engagement campaigns, weekly tips | **P1** | Medium (3d) | Email provider (Resend/SendGrid) | `lib/email.ts` |
| B005 | Create Achievement System API | Track and award badges for user milestones | **P2** | Medium (3d) | Prisma schema | `app/api/achievements/route.ts` |
| B006 | Add Social Login (NextAuth) | Configure Google OAuth provider in NextAuth | **P1** | Low (1d) | NextAuth setup | `app/api/auth/[...nextauth]/route.ts` |

#### **Phase 3: Authority (Weeks 5-6)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| B007 | Build Blog/CMS Backend | API for creating, updating, and fetching blog posts | **P1** | High (5d+) | Prisma schema | `app/api/posts/route.ts` |
| B008 | Add Search API for Content Hub | Full-text search across blog posts and resources | **P1** | Medium (3d) | Database indexes | `app/api/search/route.ts` |

#### **Phase 4: Scale (Weeks 7-8)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| B009 | Implement Premium Tier Logic | Feature flags, subscription status checks, usage limits | **P0** | High (5d+) | Payment provider | `lib/premium.ts` |
| B010 | Create Subscription API | Endpoints for subscription management (Stripe integration) | **P0** | High (5d+) | Stripe SDK | `app/api/subscription/route.ts` |
| B011 | Add Job Description Matching API | Compare resume against job description (premium feature) | **P1** | High (5d+) | AI model | `app/api/job-match/route.ts` |
| B012 | Implement Caching Strategy | Redis or Next.js cache for frequently accessed data | **P1** | Medium (3d) | Redis setup | `lib/cache.ts` |

---

### 3. Analytics/Tracking

#### **Phase 1: Foundation (Weeks 1-2)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| A001 | Setup Google Analytics 4 | Install GA4, configure events for key user actions | **P0** | Low (1d) | GA4 account | `lib/gtag.ts`, `app/layout.tsx` |
| A002 | Add Core Web Vitals Tracking | Monitor LCP, FID, CLS with Next.js reportWebVitals | **P0** | Low (1d) | None | `app/layout.tsx` |
| A003 | Implement Custom Event Tracking | Track: upload_start, analysis_complete, registration, cta_click | **P0** | Low (1d) | GA4 setup | `lib/analytics.ts` |

#### **Phase 2: Engagement (Weeks 3-4)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| A004 | Setup Conversion Funnel Tracking | Track complete user journey from landing → upload → analysis → registration | **P0** | Low (1d) | GA4 setup | GA4 config |
| A005 | Add Hotjar/FullStory Integration | Heatmaps and session recordings for UX optimization | **P1** | Low (1d) | Hotjar account | `app/layout.tsx` |
| A006 | Implement AI Coach Analytics | Track engagement rate, messages per session, satisfaction ratings | **P0** | Medium (3d) | None | `lib/analytics.ts` |

#### **Phase 3: Authority (Weeks 5-6)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| A007 | Setup Google Search Console | Monitor organic traffic, search rankings, crawl errors | **P0** | Low (1d) | GSC account | External service |
| A008 | Implement Content Analytics | Track time-on-page, scroll depth, content engagement for blog posts | **P1** | Low (1d) | GA4 setup | `lib/analytics.ts` |

#### **Phase 4: Scale (Weeks 7-8)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| A009 | Build Analytics Dashboard | Internal dashboard showing weekly KPIs and trends | **P1** | High (5d+) | Backend API | `app/admin/analytics/page.tsx` |
| A010 | Implement A/B Test Tracking | Track variant exposure and conversion metrics | **P2** | Medium (3d) | A/B testing framework | `lib/abtest.ts` |
| A011 | Add Premium Conversion Tracking | Track upgrade button clicks, pricing page visits, trial starts | **P0** | Low (1d) | GA4 setup | `lib/analytics.ts` |

---

### 4. Design/UI

#### **Phase 1: Foundation (Weeks 1-2)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| D001 | Create Design System Documentation | Document colors, typography, spacing, component styles | **P1** | Medium (3d) | None | `docs/design-system.md` |
| D002 | Design Hero Section Improvements | Mockups for new hero with prominent "+38% callbacks" stat | **P0** | Low (1d) | None | Figma file |
| D003 | Design Trust Badge Components | Visual design for badges (no credit card, private, etc.) | **P0** | Low (1d) | None | Figma file |
| D004 | Audit Color Accessibility | Ensure WCAG 2.1 Level AA compliance for all text/background pairs | **P1** | Low (1d) | None | Audit report |

#### **Phase 2: Engagement (Weeks 3-4)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| D005 | Design Dashboard Improvements | Wireframes for progress tracking, charts, achievement badges | **P0** | Medium (3d) | None | Figma file |
| D006 | Design Registration Modal | Value-driven modal with benefits list and social login | **P0** | Low (1d) | None | Figma file |
| D007 | Create Achievement Badge Graphics | Design badge icons for milestones (first analysis, 90+ score, etc.) | **P2** | Medium (3d) | None | SVG files |

#### **Phase 3: Authority (Weeks 5-6)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| D008 | Design Methodology Page | Infographics explaining three-layer scoring system | **P0** | Medium (3d) | None | Figma file |
| D009 | Design Blog Post Template | Consistent layout for insights hub articles | **P1** | Low (1d) | None | Figma file |
| D010 | Create Illustration Assets | Custom illustrations for "How It Works" and methodology pages | **P1** | High (5d+) | Illustrator | SVG/PNG files |
| D011 | Design Testimonial Cards | Photo-driven testimonials with job titles and quotes | **P0** | Low (1d) | None | Figma file |

#### **Phase 4: Scale (Weeks 7-8)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| D012 | Design Pricing Page | Three-tier pricing cards with feature comparison | **P0** | Medium (3d) | None | Figma file |
| D013 | Design Premium UI Elements | "PRO" badges, upgrade banners, feature gate overlays | **P0** | Low (1d) | None | Figma file |
| D014 | Create Social Media Assets | Open Graph images for homepage, pricing, blog posts | **P1** | Low (1d) | None | PNG files (1200x630) |
| D015 | Design Mobile-Optimized Layouts | Mobile-first redesigns for key pages | **P0** | Medium (3d) | None | Figma file |

---

### 5. Content/SEO

#### **Phase 1: Foundation (Weeks 1-2)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| C001 | Write Improved Hero Copy | Rewrite hero section to lead with "+38% callbacks" value prop | **P0** | Low (1d) | None | Copy doc |
| C002 | Create Exit Survey Questions | 3-5 questions to understand why users leave | **P1** | Low (1d) | None | Survey questions |
| C003 | Write Trust Badge Microcopy | Short, compelling text for trust indicators | **P0** | Low (1d) | None | Copy doc |

#### **Phase 2: Engagement (Weeks 3-4)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| C004 | Write Registration Value Props | Bullet points explaining benefits of creating account | **P0** | Low (1d) | None | Copy doc |
| C005 | Write Welcome Email Series | 3-email sequence for new registered users | **P1** | Medium (3d) | None | Email templates |
| C006 | Write Re-engagement Emails | Weekly tips, resume health check reminders | **P1** | Medium (3d) | None | Email templates |

#### **Phase 3: Authority (Weeks 5-6)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| C007 | Write Methodology Page Content | Detailed explanation of three-layer scoring with research citations | **P0** | Medium (3d) | None | Markdown file |
| C008 | Write 5 Cornerstone Blog Posts | SEO-optimized posts: ATS guide, resume tips, role-specific guides | **P1** | High (5d+) | Keyword research | Markdown files |
| C009 | Conduct Keyword Research | Identify 20+ target keywords for content marketing | **P1** | Low (1d) | SEO tool access | Spreadsheet |
| C010 | Create FAQ Content | 10-15 common questions for FAQ page/sections | **P1** | Low (1d) | None | FAQ doc |
| C011 | Write Testimonial Collection | Gather/write 10+ testimonials with photos and job titles | **P0** | Medium (3d) | User outreach | Testimonial doc |

#### **Phase 4: Scale (Weeks 7-8)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| C012 | Write Pricing Page Copy | Descriptions for free, premium, pro+ tiers with FAQ | **P0** | Low (1d) | None | Copy doc |
| C013 | Write How It Works Page | Step-by-step guide with clear, jargon-free language | **P1** | Medium (3d) | None | Markdown file |
| C014 | Create Competitor Comparison Copy | Feature-by-feature comparison with ResumeWorded, Jobscan, Rezi | **P1** | Low (1d) | Competitive research | Copy doc |
| C015 | Write Premium Feature Descriptions | Compelling descriptions of premium-only features | **P0** | Low (1d) | None | Copy doc |

---

### 6. Growth/Marketing

#### **Phase 1: Foundation (Weeks 1-2)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| G001 | Setup Analytics Baseline | Record current metrics for all KPIs before changes | **P0** | Low (1d) | GA4 setup | Spreadsheet |
| G002 | Create Weekly Reporting Template | Template for tracking KPIs week-over-week | **P0** | Low (1d) | None | Spreadsheet/Dashboard |

#### **Phase 2: Engagement (Weeks 3-4)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| G003 | Setup Email Marketing Platform | Configure Resend/SendGrid with templates and automation | **P1** | Low (1d) | Email service | Email platform config |
| G004 | Create Email List Segmentation | Segment users by: new, active, churned, premium-interested | **P1** | Low (1d) | Backend data | Email segments |

#### **Phase 3: Authority (Weeks 5-6)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| G005 | Launch Content Distribution | Share blog posts on LinkedIn, Twitter, relevant communities | **P1** | Low (1d/week) | Blog posts live | Social posts |
| G006 | Setup Link Building Strategy | Identify backlink opportunities, guest post targets | **P1** | Medium (3d) | None | Link building plan |
| G007 | Create LinkedIn Shareable Infographics | Visual assets from blog content for social sharing | **P1** | Medium (3d) | Design | Infographic files |

#### **Phase 4: Scale (Weeks 7-8)**

| # | Task Title | Description | Priority | Effort | Dependencies | Output |
|---|------------|-------------|----------|--------|--------------|--------|
| G008 | Run Pricing Validation Survey | Survey users on willingness to pay at different price points | **P0** | Low (1d) | User base | Survey results |
| G009 | Launch Premium Beta Program | Invite select users to test premium features | **P0** | Medium (3d) | Premium features live | Beta program |
| G010 | Setup Referral Program | Encourage users to share ResumeIQ with friends | **P2** | Medium (3d) | Backend API | Referral system |

---

## Code Setup Tasks

### Folder Structure Updates

```bash
# Create new directory structure
mkdir -p app/methodology
mkdir -p app/insights/{resume-tips,career-guides,success-stories}
mkdir -p app/pricing
mkdir -p app/how-it-works
mkdir -p app/api/{feedback,progress,achievements,posts,search,subscription,job-match}
mkdir -p components/{ui,features,marketing,dashboard,premium}
mkdir -p lib/{analytics,email,cache,premium,abtest}
mkdir -p docs
mkdir -p public/{og-images,testimonials,illustrations}
```

### Dependencies to Add

```json
{
  "dependencies": {
    "@vercel/analytics": "^1.1.1",
    "next-auth": "^4.24.5",
    "react-hook-form": "^7.49.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "stripe": "^14.10.0",
    "@stripe/stripe-js": "^2.3.0",
    "resend": "^3.0.0",
    "react-email": "^2.0.0",
    "sharp": "^0.33.1",
    "redis": "^4.6.11",
    "react-hot-toast": "^2.4.1",
    "react-intersection-observer": "^9.5.3",
    "swiper": "^11.0.5"
  },
  "devDependencies": {
    "@types/gtag.js": "^0.0.19"
  }
}
```

### Environment Variables to Add

```env
# .env.local
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@resumeiq.ai

# Premium/Payments
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Cache
REDIS_URL=redis://localhost:6379

# Feature Flags
NEXT_PUBLIC_ENABLE_PREMIUM=false
NEXT_PUBLIC_ENABLE_AB_TESTING=false
```

### Next.js Config Enhancements

```typescript
// next.config.js
const config = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  swcMinify: true,
  compress: true,

  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/blog/:path*',
        destination: '/insights/:path*',
        permanent: true,
      },
    ];
  },
};

export default config;
```

### Prisma Schema Updates

```prisma
// prisma/schema.prisma additions

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts      Account[]
  sessions      Session[]
  resumes       Resume[]
  achievements  UserAchievement[]
  subscription  Subscription?

  // Premium
  isPremium     Boolean   @default(false)
  premiumUntil  DateTime?
}

model Resume {
  id            String    @id @default(cuid())
  userId        String?
  filename      String
  score         Int
  analysis      Json
  createdAt     DateTime  @default(now())

  user          User?     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

model Achievement {
  id          String    @id @default(cuid())
  name        String    @unique
  description String
  icon        String
  category    String

  users       UserAchievement[]
}

model UserAchievement {
  id            String    @id @default(cuid())
  userId        String
  achievementId String
  unlockedAt    DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}

model Subscription {
  id            String    @id @default(cuid())
  userId        String    @unique
  stripeId      String    @unique
  status        String
  plan          String
  currentPeriodEnd DateTime

  user          User      @relation(fields: [userId], references: [id])
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String    @db.Text
  excerpt     String?
  category    String
  tags        String[]
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([category])
  @@index([published, publishedAt])
}

model Feedback {
  id        String    @id @default(cuid())
  type      String
  message   String    @db.Text
  metadata  Json?
  createdAt DateTime  @default(now())

  @@index([type, createdAt])
}
```

---

## 8-Week Timeline & Milestones

### **🔧 Phase 1: Foundation (Weeks 1-2)**
**Focus**: Optimize core conversion funnel

#### Week 1
**Tasks**: F001-F005, A001-A003, D001-D004, C001-C003, G001-G002
- ✅ Optimize hero CTA copy and add trust signals
- ✅ Implement font optimization (next/font)
- ✅ Setup Google Analytics 4 and event tracking
- ✅ Improve SEO metadata
- ✅ Create design system documentation
- ✅ Audit color accessibility

**Milestone**: Analytics tracking live, improved CTAs deployed

#### Week 2
**Tasks**: F003, F006-F008, B001-B002, D002-D003
- ✅ Implement sticky mobile CTA
- ✅ Enhance upload flow with progress indicators
- ✅ Add social proof/testimonials section
- ✅ Create exit survey and API
- ✅ Design hero section improvements

**Milestone**: Upload-to-analyze conversion increases by 10-15%

---

### **👥 Phase 2: Engagement (Weeks 3-4)**
**Focus**: Drive registration and retention

#### Week 3
**Tasks**: F009-F010, F013, B003-B004, B006, A004-A006, D005-D006, C004-C006, G003-G004
- ✅ Enhance registration modal with value props
- ✅ Implement social login (Google OAuth)
- ✅ Build progress tracking API and dashboard
- ✅ Setup email service with welcome series
- ✅ Track conversion funnel in GA4
- ✅ Design dashboard improvements

**Milestone**: Registration rate increases to 28-30%

#### Week 4
**Tasks**: F007, F011-F012, B005
- ✅ Create exit-intent modal
- ✅ Implement resume version comparison view
- ✅ Add achievement badge system (basic)
- ✅ Create achievement API

**Milestone**: Dashboard enhancements deployed, email system operational

---

### **🏆 Phase 3: Authority (Weeks 5-6)**
**Focus**: Build brand trust and differentiation

#### Week 5
**Tasks**: F014, F017-F019, D008-D009, D011, C007, C009-C011
- ✅ Create "How Our Scoring Works" methodology page
- ✅ Add structured data (Schema.org)
- ✅ Generate sitemap and robots.txt
- ✅ Design methodology page with infographics
- ✅ Write methodology content with research citations
- ✅ Conduct keyword research
- ✅ Collect testimonials

**Milestone**: Methodology page live with good traffic

#### Week 6
**Tasks**: F015-F016, B007-B008, A007-A008, C008, C010, D010, G005-G007
- ✅ Build content hub (/insights) infrastructure
- ✅ Write 5 cornerstone blog posts
- ✅ Create interactive scoring calculator
- ✅ Setup Google Search Console
- ✅ Launch content distribution strategy
- ✅ Create LinkedIn-shareable infographics

**Milestone**: 5 blog posts published, SEO foundation complete

---

### **🚀 Phase 4: Scale (Weeks 7-8)**
**Focus**: Mobile optimization and premium tier preparation

#### Week 7
**Tasks**: F020-F021, F026, D012-D015, C012-C014
- ✅ Mobile performance optimization (lazy loading, code splitting)
- ✅ Add mobile camera capture for resumes
- ✅ Create "How It Works" page
- ✅ Design pricing page and premium UI elements
- ✅ Write pricing copy and feature descriptions
- ✅ Design mobile-optimized layouts

**Milestone**: Mobile page load < 2.5s, mobile conversion gap reduced to 35%

#### Week 8
**Tasks**: F022-F025, B009-B012, A009-A011, C015, G008-G010
- ✅ Build pricing page with three tiers
- ✅ Implement premium tier infrastructure
- ✅ Create subscription API (Stripe integration)
- ✅ Add feature flags for premium gating
- ✅ Build analytics dashboard
- ✅ Run pricing validation survey
- ✅ Launch premium beta program

**Milestone**: Premium tier infrastructure ready, pricing page live

---

### **Key Deliverables Summary**

| Phase | Duration | Primary Goal | Success Metric |
|-------|----------|--------------|----------------|
| **Phase 1** | Weeks 1-2 | Optimize conversion funnel | +15% upload conversion |
| **Phase 2** | Weeks 3-4 | Drive registration | 30%+ registration rate |
| **Phase 3** | Weeks 5-6 | Build authority | +50% methodology visits |
| **Phase 4** | Weeks 7-8 | Scale & monetize | Premium infrastructure ready |

---

## Claude Code Automation Task List

### [CODE TASKS - PRIORITY ORDER]

#### **🔥 Week 1-2: Foundation (P0 Tasks)**

1. `OptimizeHeroCTACopy()`
   - **File**: `app/page.tsx:189-196`
   - **Action**: Change "Start your free analysis" → "Get My Free Resume Score" + subtext "See results in 6 minutes"

2. `CreateTrustBadgesComponent()`
   - **File**: `components/TrustBadges.tsx` (new)
   - **Action**: Create component with icons: "No credit card", "Private & secure", "Results in 6 min"
   - **Usage**: Add below all primary CTAs

3. `MigrateFontsToNextFont()`
   - **File**: `app/layout.tsx:19-24`
   - **Action**: Replace Google Fonts CDN with `next/font/google` imports for Inter and Space Grotesk
   - **Expected**: -300ms page load improvement

4. `ImproveRootMetadata()`
   - **File**: `app/layout.tsx:6-9`
   - **Action**: Add comprehensive metadata: title template, keywords, Open Graph, Twitter Card, robots
   - **Include**: Schema.org WebApplication and Organization JSON-LD

5. `SetupGoogleAnalytics4()`
   - **Files**: `lib/gtag.ts` (new), `app/layout.tsx`
   - **Action**: Install GA4 with custom events: upload_start, analysis_complete, registration_start, cta_click

6. `AddCoreWebVitalsTracking()`
   - **File**: `app/layout.tsx`
   - **Action**: Implement `reportWebVitals()` function to log LCP, FID, CLS to GA4

7. `CreateStickyMobileCTA()`
   - **File**: `components/MobileCTA.tsx` (new)
   - **Action**: Sticky bottom CTA for mobile that appears after scrolling 800px
   - **Text**: "Get My Free Resume Score" + trust badges

8. `EnhanceUploadFlowWithProgress()`
   - **File**: `components/UploadSection.tsx`
   - **Action**: Add progress stages: Uploading → Extracting text → Analyzing → Generating score
   - **Add**: "What happens next" section with bullet points

9. `CreateExitSurveyAPI()`
   - **File**: `app/api/feedback/route.ts` (new)
   - **Action**: POST endpoint accepting feedback type, message, metadata
   - **Prisma**: Use Feedback model

10. `GenerateSitemapAndRobots()`
    - **Files**: `app/sitemap.ts` (new), `app/robots.ts` (new)
    - **Action**: Dynamic sitemap generation with all pages, robots.txt with proper disallow rules

#### **👥 Week 3-4: Engagement (P0 Tasks)**

11. `CreateRegistrationModal()`
    - **File**: `components/RegistrationModal.tsx` (new)
    - **Action**: Value-driven modal appearing after analysis with benefits list (Save analysis, Track progress, Unlimited AI Coach)
    - **Include**: Social login button

12. `ImplementGoogleOAuth()`
    - **File**: `app/api/auth/[...nextauth]/route.ts`
    - **Action**: Configure NextAuth with Google provider
    - **Add**: Prisma adapter for session management

13. `BuildProgressTrackingAPI()`
    - **File**: `app/api/progress/route.ts` (new)
    - **Action**: GET endpoint returning user's resume history with scores over time
    - **Prisma**: Query Resume model with userId filter

14. `EnhanceDashboardWithCharts()`
    - **File**: `app/dashboard/page.tsx`
    - **Action**: Add score improvement timeline chart, milestone celebrations
    - **Library**: Use Recharts or Chart.js

15. `SetupEmailService()`
    - **File**: `lib/email.ts` (new)
    - **Action**: Configure Resend API, create sendWelcomeEmail(), sendWeeklyTips() functions
    - **Templates**: Use react-email for templates

16. `CreateResumeComparisonView()`
    - **File**: `components/ComparisonView.tsx` (new)
    - **Action**: Side-by-side comparison of two resume versions with diff highlighting

17. `TrackConversionFunnel()`
    - **File**: `lib/analytics.ts`
    - **Action**: Add funnel events: page_view → upload_start → upload_complete → analysis_view → registration_start → registration_complete

#### **🏆 Week 5-6: Authority (P0 Tasks)**

18. `CreateMethodologyPage()`
    - **File**: `app/methodology/page.tsx` (new)
    - **Action**: Static page explaining three-layer scoring (ATS, Content, Human Alignment)
    - **Include**: Diagrams, research citations, CTA at bottom

19. `AddStructuredData()`
    - **File**: `app/layout.tsx`
    - **Action**: Add JSON-LD scripts for WebApplication, Organization, AggregateRating schemas

20. `BuildContentHubInfrastructure()`
    - **Files**: `app/insights/page.tsx` (new), `app/insights/[slug]/page.tsx` (new)
    - **Action**: Blog listing with categories, pagination, individual post pages
    - **CMS**: Use MDX or Prisma-based CMS

21. `CreateBlogPostAPI()`
    - **File**: `app/api/posts/route.ts` (new)
    - **Action**: CRUD endpoints for blog posts (GET all, GET by slug, POST create, PUT update)
    - **Prisma**: Use Post model

22. `SetupGoogleSearchConsole()`
    - **Action**: Verify domain, submit sitemap, configure data sharing
    - **Add**: Verification token to metadata

23. `CreateInteractiveScoringCalculator()`
    - **File**: `components/ScoringCalculator.tsx` (new)
    - **Action**: Interactive tool showing how improvements affect score in real-time

#### **🚀 Week 7-8: Scale (P0 Tasks)**

24. `OptimizeMobilePerformance()`
    - **Files**: Multiple components, `next.config.js`
    - **Actions**:
      - Lazy load Framer Motion components
      - Code split PDF libraries
      - Add `loading="lazy"` to images
      - Reduce mobile animations via CSS media queries

25. `AddMobileCameraCapture()`
    - **File**: `components/UploadSection.tsx`
    - **Action**: Add button for mobile: "Take a photo of your resume"
    - **Implementation**: Use `<input type="file" accept="image/*" capture="environment">`

26. `CreatePricingPage()`
    - **File**: `app/pricing/page.tsx` (new)
    - **Action**: Three-tier pricing (Free, Premium $19/mo, Pro+ $49/mo) with FAQ section
    - **Include**: Competitor comparison table

27. `ImplementPremiumInfrastructure()`
    - **Files**: `lib/premium.ts` (new), multiple components
    - **Actions**:
      - Create `isPremiumFeature()` middleware
      - Add "PRO" badges to premium features
      - Show upgrade CTAs for free users
      - Implement feature gating

28. `CreateSubscriptionAPI()`
    - **File**: `app/api/subscription/route.ts` (new)
    - **Action**: Stripe integration for checkout, webhook handling, subscription management
    - **Endpoints**: POST /create-checkout, POST /webhook, GET /status

29. `BuildAnalyticsDashboard()`
    - **File**: `app/admin/analytics/page.tsx` (new)
    - **Action**: Internal dashboard showing weekly KPIs (visitors, conversions, registrations, revenue)
    - **Protected**: Admin-only route

30. `AddPremiumConversionTracking()`
    - **File**: `lib/analytics.ts`
    - **Action**: Track events: pricing_page_view, upgrade_click, checkout_start, subscription_complete

#### **Optional Enhancements (P1/P2)**

31. `CreateExitIntentModal()` - **P1**
    - **File**: `components/ExitIntentModal.tsx`
    - **Trigger**: Mouse leaves viewport from top
    - **Content**: "Wait! Get your free analysis in 6 minutes"

32. `ImplementAchievementSystem()` - **P2**
    - **Files**: `app/api/achievements/route.ts`, `components/AchievementBadges.tsx`
    - **Badges**: First analysis, 90+ score, 5 analyses, 30-day streak

33. `AddABTestingFramework()` - **P2**
    - **File**: `lib/abtest.ts`
    - **Implementation**: Use Vercel Edge Config or LaunchDarkly
    - **Tests**: CTA copy variations, pricing tiers

34. `CreateHowItWorksPage()` - **P1**
    - **File**: `app/how-it-works/page.tsx`
    - **Content**: Step-by-step guide with visuals, video demo embed

35. `ImplementRedisCache()` - **P1**
    - **File**: `lib/cache.ts`
    - **Action**: Cache frequently accessed data (user resumes, blog posts)
    - **TTL**: 1 hour for dynamic, 24 hours for static

---

### **Code Task Checklist Format**

```markdown
## Implementation Checklist

### Phase 1 (Weeks 1-2)
- [ ] F001: OptimizeHeroCTACopy → `app/page.tsx`
- [ ] F002: CreateTrustBadgesComponent → `components/TrustBadges.tsx`
- [ ] F004: MigrateFontsToNextFont → `app/layout.tsx`
- [ ] F005: ImproveRootMetadata → `app/layout.tsx`
- [ ] A001: SetupGoogleAnalytics4 → `lib/gtag.ts`
- [ ] A002: AddCoreWebVitalsTracking → `app/layout.tsx`
- [ ] F003: CreateStickyMobileCTA → `components/MobileCTA.tsx`
- [ ] F008: EnhanceUploadFlowWithProgress → `components/UploadSection.tsx`
- [ ] B001: CreateExitSurveyAPI → `app/api/feedback/route.ts`
- [ ] F018: GenerateSitemapAndRobots → `app/sitemap.ts`, `app/robots.ts`

### Phase 2 (Weeks 3-4)
- [ ] F009: CreateRegistrationModal → `components/RegistrationModal.tsx`
- [ ] F013: ImplementGoogleOAuth → `app/api/auth/[...nextauth]/route.ts`
- [ ] B003: BuildProgressTrackingAPI → `app/api/progress/route.ts`
- [ ] F010: EnhanceDashboardWithCharts → `app/dashboard/page.tsx`
- [ ] B004: SetupEmailService → `lib/email.ts`
- [ ] F011: CreateResumeComparisonView → `components/ComparisonView.tsx`
- [ ] A004: TrackConversionFunnel → `lib/analytics.ts`

### Phase 3 (Weeks 5-6)
- [ ] F014: CreateMethodologyPage → `app/methodology/page.tsx`
- [ ] F017: AddStructuredData → `app/layout.tsx`
- [ ] F015: BuildContentHubInfrastructure → `app/insights/`
- [ ] B007: CreateBlogPostAPI → `app/api/posts/route.ts`
- [ ] F016: CreateInteractiveScoringCalculator → `components/ScoringCalculator.tsx`

### Phase 4 (Weeks 7-8)
- [ ] F020: OptimizeMobilePerformance → Multiple files
- [ ] F021: AddMobileCameraCapture → `components/UploadSection.tsx`
- [ ] F022: CreatePricingPage → `app/pricing/page.tsx`
- [ ] B009: ImplementPremiumInfrastructure → `lib/premium.ts`
- [ ] B010: CreateSubscriptionAPI → `app/api/subscription/route.ts`
- [ ] A009: BuildAnalyticsDashboard → `app/admin/analytics/page.tsx`
```

---

## Success Metrics & KPIs

### North Star Metric
**Resume Analyses Completed per Week**
- **Baseline**: TBD (measure in Week 1)
- **Target (8 weeks)**: +30% from baseline
- **Target (3 months)**: +50% from baseline

### Conversion Funnel Metrics

| Stage | Metric | Baseline | Week 4 Target | Week 8 Target |
|-------|--------|----------|---------------|---------------|
| **Acquisition** | Unique Visitors/Week | TBD | +10% | +25% |
| **Activation** | Upload Conversion Rate | TBD | +15% | +25% |
| **Engagement** | Analysis Completion Rate | TBD | +10% | +15% |
| **Registration** | Registration Rate | 25% | 30% | 35% |
| **Retention** | 14-Day Return Rate | 45% | 55% | 60% |

### Goal-Specific KPIs

#### Goal 1: Conversion (Visitor → Analyzer)
- **Primary**: Upload-to-analyze conversion +25% ✅
- **Secondary**: Bounce rate reduction -15%
- **Tertiary**: Time-on-page hero section +30 seconds

#### Goal 2: Registration & Retention
- **Primary**: Registration rate +40% (25% → 35%) ✅
- **Secondary**: 14-day return rate 60% ✅
- **Tertiary**: Avg analyses per user 3.0+

#### Goal 3: Brand Authority
- **Primary**: Methodology page visits +50% ✅
- **Secondary**: Session duration 8+ minutes
- **Tertiary**: Trust survey score 70%+ "High/Very High"

#### Goal 4: Mobile Optimization
- **Primary**: Mobile/desktop conversion gap 20% ✅
- **Secondary**: Mobile bounce rate -25%
- **Tertiary**: Mobile page load <2.5 seconds ✅

#### Goal 5: AI Coach Engagement
- **Primary**: 45% users interact with Coach ✅
- **Secondary**: 5+ messages per chat session
- **Tertiary**: 80% positive sentiment

#### Goal 6: Premium Tier
- **Primary**: 25%+ express interest in premium ✅
- **Secondary**: $12+ perceived value (survey)
- **Tertiary**: Top 3 most desired features identified

### Technical Performance Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Largest Contentful Paint (LCP)** | ~3.5s | <2.5s |
| **First Input Delay (FID)** | Good | <100ms |
| **Cumulative Layout Shift (CLS)** | TBD | <0.1 |
| **Time to First Byte (TTFB)** | TBD | <600ms |
| **Lighthouse Score** | TBD | 90+ |

### Weekly Tracking Dashboard

```typescript
// Example weekly metrics object
interface WeeklyMetrics {
  week: number;
  dateRange: string;

  // Acquisition
  uniqueVisitors: number;
  organicTraffic: number;
  directTraffic: number;
  referralTraffic: number;

  // Conversion Funnel
  uploadAttempts: number;
  uploadCompletions: number;
  uploadConversionRate: number;
  analysesCompleted: number;
  registrations: number;
  registrationRate: number;

  // Engagement
  avgSessionDuration: number;
  avgTimeOnPage: Record<string, number>;
  returnVisitorRate: number;
  aiCoachInteractions: number;
  aiCoachEngagementRate: number;
  avgMessagesPerChat: number;

  // Authority
  methodologyPageViews: number;
  blogPageViews: number;
  avgContentEngagement: number;

  // Mobile
  mobileVisitors: number;
  mobileConversionRate: number;
  desktopConversionRate: number;
  mobileDesktopGap: number;
  avgMobilePageLoad: number;

  // Premium
  pricingPageViews: number;
  upgradeClicks: number;
  premiumInterestRate: number;
  trialStarts: number;
  subscriptions: number;

  // Technical
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  errorRate: number;
}
```

### Milestone Checklist

#### 2-Week Milestones
- [ ] Upload conversion increases by 10%
- [ ] Page load time under 3 seconds
- [ ] Analytics tracking fully operational
- [ ] 5+ A/B test experiments running

#### 4-Week Milestones
- [ ] Registration rate reaches 30%
- [ ] Dashboard enhancements deployed
- [ ] Social login implemented
- [ ] Email system sending automated campaigns

#### 6-Week Milestones
- [ ] Methodology page live with 1000+ views
- [ ] 5 blog posts published
- [ ] SEO traffic increases by 25%
- [ ] Trust survey shows 70%+ "High" ratings

#### 8-Week Milestones
- [ ] Mobile conversion gap reduced to 30%
- [ ] Premium tier infrastructure ready
- [ ] Pricing page live with validated pricing
- [ ] All Phase 1-4 P0 tasks complete

---

## Risk Mitigation & Contingency Plans

### Risk 1: Performance Degradation
**Mitigation**:
- Set performance budgets for all new features
- Load test before deployment
- Implement monitoring with real-time alerts

### Risk 2: Mobile Conversion Still Low
**Contingency**:
- Run user testing sessions with mobile users
- Implement additional mobile-specific improvements
- Consider progressive web app (PWA) features

### Risk 3: Premium Tier Low Interest
**Contingency**:
- Adjust pricing based on survey feedback
- Enhance free tier to build trust first
- Delay premium launch until stronger user base

### Risk 4: Content Creation Bottleneck
**Contingency**:
- Use AI to draft initial content (human review required)
- Partner with freelance writers
- Repurpose existing documentation

### Risk 5: Technical Debt from Rapid Development
**Mitigation**:
- Allocate 20% of time to refactoring
- Code reviews for all P0 features
- Documentation alongside implementation

---

## Post-Launch Plan (Week 9+)

### Immediate Next Steps
1. **Week 9-10**: Monitor metrics, collect user feedback, iterate
2. **Week 11-12**: Launch premium tier publicly with marketing campaign
3. **Month 4**: Implement top-requested features from user feedback
4. **Month 5-6**: Focus on growth: SEO, content marketing, partnerships

### Long-Term Roadmap (Beyond 8 Weeks)
- **LinkedIn Profile Optimization** (Competitor feature)
- **Job Description Matching** (Jobscan's killer feature)
- **Resume Builder Integration** (Partner or build)
- **Mobile App** (iOS/Android)
- **Enterprise Tier** (Team accounts, admin dashboard)
- **API for Developers** (Public API with documentation)

---

## Appendix A: Quick Reference

### Priority Definitions
- **P0**: Critical, must-have for launch, blocks other work
- **P1**: Important, should-have, significant impact
- **P2**: Nice-to-have, can be delayed if needed

### Effort Estimates
- **Low (1d)**: 1-8 hours of work
- **Medium (3d)**: 16-24 hours of work
- **High (5d+)**: 32+ hours of work

### File Path Conventions
- `app/` - Next.js pages and layouts
- `components/` - React components
- `lib/` - Utility functions, helpers
- `app/api/` - API routes
- `docs/` - Documentation
- `public/` - Static assets

---

## Appendix B: Tools & Resources

### Development Tools
- **VS Code** + ESLint + Prettier
- **Figma** for design
- **Postman** for API testing
- **Prisma Studio** for database management

### Analytics & Monitoring
- **Google Analytics 4** - User behavior tracking
- **Vercel Analytics** - Core Web Vitals
- **Sentry** - Error monitoring
- **LogRocket** - Session replay

### External Services
- **Stripe** - Payments
- **Resend** - Email delivery
- **Vercel** - Hosting & deployment
- **PlanetScale** or **Supabase** - Production database

---

## Document Control

**Author**: Claude AI (Lead Technical Architect + Product Manager)
**Approved By**: Product Team
**Last Updated**: November 12, 2025
**Next Review**: Week 2 (November 26, 2025)

**Changelog**:
- v1.0 (2025-11-12): Initial execution plan created from redesign goals

**Feedback**: Create GitHub issue or comment on PRs for task-specific feedback

---

**END OF DOCUMENT**

---

*This execution plan is ready for import into GitHub Projects, Notion, or Jira. Use the task IDs (F001, B001, etc.) for tracking and referencing in commits and PRs.*

**Next Action**: Review plan with team → Assign tasks → Begin Week 1 implementation 🚀
