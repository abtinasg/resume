# ResumeIQ Codebase Structure Map

## Overview
This document provides a comprehensive map of the ResumeIQ application structure, focusing on layouts, components, pages, and architectural patterns.

---

## 1. ROUTE GROUP HIERARCHY & LAYOUT FILES

### Root Layout
**Location:** `/home/user/resume/app/layout.tsx`
- **Type:** Root layout for entire application
- **Key Components:**
  - `Navbar` - Global navigation component
  - `AuthProvider` - Authentication context wrapper
  - `SessionProvider` - Session management wrapper
- **Purpose:** Sets up fonts (Inter, Space Grotesk), metadata, and global structure
- **PT offset:** `pt-24 md:pt-28` (navbar spacing)

### Main Route Group Layout
**Location:** `/home/user/resume/app/(main)/layout.tsx`
- **Type:** Pass-through layout (empty wrapper)
- **Pages within (main):**
  - `/achievements` - User achievements/badges page
  - `/contact` - Contact form page
  - `/job-match` - Job matching analysis page
  - `/search` - Content search page

### Admin Route Group Layout
**Location:** `/home/user/resume/app/admin/layout.tsx`
- **Type:** Protected layout with sidebar navigation
- **Key Features:**
  - Admin authentication check on mount
  - Collapsible sidebar with top bar
  - Lucide icons for navigation
- **Navigation Items (using lucide-react icons):**
  - `LayoutDashboard` - Overview
  - `Users` - Users management
  - `Award` - Badges management
  - `FileText` - Blog posts
  - `TrendingUp` - Progress tracking
- **Admin Pages:**
  - `/admin` - Overview/dashboard
  - `/admin/users` - User management
  - `/admin/badges` - Badge management
  - `/admin/posts` - Blog post management
  - `/admin/tracking` - Progress tracking

---

## 2. ALL PAGE FILES

### Public/Landing Pages

| Route | File | Purpose | Key Sections |
|-------|------|---------|--------------|
| `/` | `app/page.tsx` | Home/Landing page | Hero, Upload, Results, Features, Demo, About, Contact, Testimonials |
| `/how-it-works` | `app/how-it-works/page.tsx` | Feature walkthrough | Step-by-step process with icons |
| `/pricing` | `app/pricing/page.tsx` | Pricing tiers | Comparison table, FAQs, tier selection |
| `/methodology` | `app/methodology/page.tsx` | Scoring explanation | Score ranges, algorithm details, calculator |
| `/insights` | `app/insights/page.tsx` | Blog/articles list | Search, filter, pagination (6 items/page) |
| `/insights/[slug]` | `app/insights/[slug]/page.tsx` | Individual article | Article content display |

### Auth Pages

| Route | File | Purpose | Functionality |
|-------|------|---------|---|
| `/auth/login` | `app/auth/login/page.tsx` | User login | Email/password form with redirect |
| `/auth/register` | `app/auth/register/page.tsx` | User registration | Form with validation, password complexity |

### Authenticated User Pages

| Route | File | Purpose | Protected |
|-------|------|---------|-----------|
| `/dashboard` | `app/dashboard/page.tsx` | User dashboard | Yes - shows resumes, comparison |
| `/profile` | `app/profile/page.tsx` | User profile | Yes - shows user info, logout |
| `/(main)/achievements` | `app/(main)/achievements/page.tsx` | Badges/achievements | Yes - displays earned badges |
| `/(main)/job-match` | `app/(main)/job-match/page.tsx` | Job matching | Yes - job analysis against resume |
| `/(main)/contact` | `app/(main)/contact/page.tsx` | Contact form | No - available to all users |
| `/(main)/search` | `app/(main)/search/page.tsx` | Content search | No - searchable content |

### Admin Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `app/admin/page.tsx` | Analytics overview |
| `/admin/users` | `app/admin/users/page.tsx` | User management |
| `/admin/badges` | `app/admin/badges/page.tsx` | Badge management |
| `/admin/posts` | `app/admin/posts/page.tsx` | Blog post management |
| `/admin/tracking` | `app/admin/tracking/page.tsx` | Progress tracking |

---

## 3. ALL COMPONENT FILES

### Top-Level Components (in `/home/user/resume/components/`)

#### Navigation & Headers
- **`Navbar.tsx`** (300 lines)
  - Global navigation with auth state detection
  - Responsive design (hamburger menu on mobile)
  - Different nav links for authenticated vs. public users
  - Premium badge display
  - Search icon integration
  - Scroll-based transparency effect

#### CTA & Modal Components
- **`MobileCTA.tsx`** (115 lines)
  - Sticky bottom CTA on mobile
  - "Ready to improve your resume?" messaging
  - Dismissible after scroll threshold
  - Trust indicators (no credit card, 6-min results)

- **`ExitIntentModal.tsx`** (268 lines)
  - Triggers on mouseLeave from top of page
  - Session storage to prevent repeat displays
  - Premium feature showcase

- **`RegistrationModal.tsx`** (288 lines)
  - Benefits display with icons
  - Login/Register routing
  - Score-aware messaging
  - Used on home page after analysis

#### Analysis & Results Components
- **`UploadSection.tsx`** (881 lines) - LARGEST COMPONENT
  - Resume upload (PDF/Image)
  - Drag & drop functionality
  - Base64 conversion
  - Progress tracking
  - Analysis processing states
  - Camera input for mobile

- **`AIReport.tsx`** (435 lines)
  - AI verdict display
  - Hybrid scoring
  - Content/Tailoring scores
  - Detailed recommendations

- **`ResultsTabs.tsx`** (369 lines)
  - Two-column layout: AI Report + Resume Coach
  - Responsive design (side-by-side desktop, stacked mobile)
  - Analyze Another Resume button

- **`Results3D.tsx`** (364 lines)
  - 3D visualization of results
  - Interactive scoring display

- **`ScoringCalculator.tsx`** (483 lines)
  - Interactive scoring logic
  - Algorithm visualization

#### Section Components (Landing Page)
- **`FeaturesSection.tsx`** (160 lines)
  - Platform features showcase
  - Icon-based feature cards

- **`DemoSection.tsx`** (404 lines)
  - Interactive demo with stages
  - Auto-advance animation
  - Apple-style ambient background

- **`AboutSection.tsx`** (160 lines)
  - Company/product story
  - Value proposition

- **`ContactSection.tsx`** (268 lines)
  - Contact form section
  - Email integration

- **`TestimonialsSection.tsx`** (225 lines)
  - User testimonials carousel
  - Rating display

- **`TrustBadges.tsx`** (50 lines)
  - Trust indicators (reviews, users, etc.)

#### Chat Components
- **`ChatBot.tsx`** (311 lines)
  - General chatbot interface
  - Message display and input

- **`ChatBotPanel.tsx`** (50 lines)
  - Embedded chat panel

- **`ResumeCoachChat.tsx`** (150 lines)
  - Resume-specific coaching chat

- **`ResumeCoachChatDocked.tsx`** (150 lines)
  - Docked version of coach chat
  - Displayed alongside AI Report

#### Other Components
- **`ComparisonView.tsx`** (360 lines)
  - Resume comparison interface
  - Multiple resume analysis

- **`ComparisonTable.tsx`** (240 lines)
  - Tabular comparison display

- **`LoadingProgress.tsx`** (320 lines)
  - Processing state visualization
  - Progress indicators

- **`PremiumBadge.tsx`** (80 lines)
  - Badge showing premium/pro+ status
  - Displayed in navbar

- **`AchievementBadges.tsx`** (200 lines)
  - Badge grid display
  - Earned/locked status

- **`FeatureGate.tsx`** (50 lines)
  - Feature flag component
  - Premium feature access control

- **`AuthProvider.tsx`** (20 lines)
  - Auth context provider

- **`SessionProvider.tsx`** (20 lines)
  - Session context provider

### Results Subdirectory (`/components/results/`)
- **`ResultsContainer.tsx`** (100 lines)
  - Main results container wrapper
  
- **`ResultsTabs.tsx`** (50 lines)
  - Tab navigation for results
  - NAMING NOTE: Different from `/components/ResultsTabs.tsx`
  
- **`LoadingSkeleton.tsx`** (120 lines)
  - Skeleton UI while loading
  
- **`EmptyState.tsx`** (200 lines)
  - Empty state display
  
- **`ErrorState.tsx`** (250 lines)
  - Error state display

### UI Subdirectory (`/components/ui/`)
Shadcn/ui-style components:
- **`button.tsx`** (50 lines)
- **`card.tsx`** (30 lines)
- **`tabs.tsx`** (40 lines)
- **`input.tsx`** (30 lines)
- **`textarea.tsx`** (25 lines)
- **`alert.tsx`** (60 lines)
- **`badge.tsx`** (30 lines)
- **`index.ts`** - Exports all UI components

---

## 4. ICON COMPONENTS & LUCIDE-REACT USAGE

### Icon Library
**Framework:** lucide-react (SVG icons)
**Import Pattern:** `import { IconName } from 'lucide-react'`

### Most Used Icons

| Icon | Components Using It | Purpose |
|------|---------------------|---------|
| `Search` | Navbar, Insights page | Search functionality |
| `ArrowRight` | Many CTAs, buttons | Direction/next indication |
| `Sparkles` | Hero, CTAs, modals | AI/premium feature indicator |
| `TrendingUp` | Admin, achievements, insights | Growth/improvement indicator |
| `Award` | Admin nav, achievements | Badges/achievements |
| `Users` | Admin, insights | User-related features |
| `FileText` | Admin, dashboard | Resume/document reference |
| `CheckCircle2` | CTAs, benefits, modals | Success/completed state |
| `Lock` | Premium features, modals | Premium/protected content |
| `Target` | Hero, features, pages | Goals/job matching |
| `Zap` | Features, pricing, modals | Speed/power indicator |
| `Star` | Registration modal, testimonials | Rating/quality |
| `X` | Close buttons, dismiss | Close/remove |
| `Menu` | Mobile navbar | Menu toggle |

### Icon Usage by Page/Component

**Home Page (`app/page.tsx`):**
- Sparkles, ArrowRight, Lock, Zap, ShieldCheck, Target, Users, LineChart, Compass

**Admin Layout:**
- LayoutDashboard, Users, Award, FileText, TrendingUp, Menu, X

**Achievements Page:**
- Trophy, Lock, Sparkles, TrendingUp, Target, Award, Star, Zap, Loader2, CheckCircle

**Job Match Page:**
- Upload, FileText, Sparkles, AlertCircle, CheckCircle, XCircle, TrendingUp, Target, Zap, Clock, Loader2, ArrowRight, Award, BarChart3

**Pricing Page:**
- Check, X, Crown, Sparkles, Zap, Target, TrendingUp, Shield, ChevronDown, Star, Rocket, Users, MessageCircle

**Methodology Page:**
- Target, Award, Zap, TrendingUp, CheckCircle2, AlertCircle, BarChart3, Lightbulb, Code, FileText, Users, Sparkles, ArrowRight, ChevronDown, Shield, Brain, Layers

**How It Works Page:**
- Upload, Sparkles, BarChart3, Download, FileText, Brain, Zap, Target, CheckCircle2, ArrowRight, TrendingUp, MessageCircle, Award, Shield, Clock, Layers, Code

**Insights Page:**
- Search, Filter, TrendingUp, Clock, User, Eye, ArrowRight, BookOpen, Sparkles, Tag, Calendar, ChevronLeft, ChevronRight, Loader2

**Contact Page:**
- Mail, Send, CheckCircle, AlertCircle, Loader2, MessageSquare, User, AtSign

---

## 5. DUPLICATE & OVERLAPPING COMPONENTS

### Naming Duplication Issue

**ResultsTabs Components - TWO VERSIONS:**
1. `/home/user/resume/components/ResultsTabs.tsx` (369 lines)
   - Two-column layout: AI Report + Resume Coach
   - Takes `AnalysisResult` type
   - Used in main results display
   
2. `/home/user/resume/components/results/ResultsTabs.tsx` (50 lines)
   - Tab navigation component
   - Takes `AnalysisData` type
   - Different functionality
   - Located in subdirectory

**Status:** This is confusing naming but they serve different purposes. The root-level version is the main results display, while the subdirectory version is a utility tab component.

### CTA Component Family (No Duplication)

| Component | Purpose | Usage |
|-----------|---------|-------|
| `MobileCTA` | Sticky mobile CTA | Home page only |
| `ExitIntentModal` | Exit intent modal | Available but not used in main |
| `RegistrationModal` | Registration prompt | Home page after analysis |

**All are unique - no true duplication**

### Section Components (Landing Page)
All section components are used exclusively on the home page with no duplication:
- FeaturesSection (features display)
- DemoSection (methodology demo)
- AboutSection (company story)
- ContactSection (contact form)
- TestimonialsSection (testimonials)

### Chat Component Family (Related, Not Duplicate)

| Component | Purpose | Relationship |
|-----------|---------|---|
| `ChatBot` | General chat interface | Base implementation |
| `ChatBotPanel` | Embedded panel version | Wraps ChatBot |
| `ResumeCoachChat` | Resume-specific coaching | Specialized variant |
| `ResumeCoachChatDocked` | Docked side-by-side display | UI variant of coach chat |

**These are intentional variants, not duplicates**

---

## 6. CTA COMPONENT SUMMARY

### CTA Components & Locations

#### MobileCTA
- **File:** `/home/user/resume/components/MobileCTA.tsx`
- **Usage:** Home page only (`app/page.tsx`)
- **Type:** Sticky bottom modal
- **Triggers:** After scrolling past hero (600px)
- **Copy:** "Ready to improve your resume?" / "Start free"
- **Icons Used:** ArrowRight, X (lucide-react)

#### RegistrationModal
- **File:** `/home/user/resume/components/RegistrationModal.tsx`
- **Usage:** Home page only (`app/page.tsx`)
- **Type:** Post-analysis conversion modal
- **Triggers:** After analysis completes (conditional)
- **Benefits Displayed:** 
  - Save analysis results (Star icon)
  - Track progress (TrendingUp icon)
  - Unlock premium (Award icon)
  - Personalized dashboard (CheckCircle2 icon)
- **Icons Used:** X, Sparkles, ArrowRight, Lock, CheckCircle2, Star, TrendingUp, Award

#### ExitIntentModal
- **File:** `/home/user/resume/components/ExitIntentModal.tsx`
- **Status:** Defined but NOT integrated into pages
- **Type:** Exit intent trigger
- **Icons Used:** X, Sparkles, ArrowRight, Lock

#### Button CTAs in Navbar
- **Location:** `/home/user/resume/components/Navbar.tsx`
- **Desktop Buttons:**
  - "Login" (text link)
  - "Get Started" (gradient button) - unauthenticated
  - "Profile" (text link) - authenticated
  - "Logout" (red button) - authenticated
- **Mobile Buttons:**
  - "Login" (outline button)
  - "Sign Up" (gradient button)
  - "Profile" (blue button)
  - "Logout" (red button)

#### Button CTAs in Pages
- **Home:** "Analyze My Resume" in hero and sections
- **Pricing:** "Start Free" / "Upgrade Now" buttons per tier
- **Dashboard:** "Upload Resume" (large primary CTA)
- **All Pages:** Context-specific action buttons

---

## 7. HEADER/NAVBAR COMPONENTS

### Navbar Component
**File:** `/home/user/resume/components/Navbar.tsx` (300 lines)

**Key Features:**
- Fixed positioning with z-50
- Scroll-based transparency (glassmorphic effect)
- Motion animations (framer-motion)
- Responsive hamburger menu
- Auth state-aware navigation
- Two different nav link sets:
  - **Public:** Home, How It Works, Methodology, Pricing, Insights
  - **Authenticated:** Home, Dashboard, Achievements, Job Match, Insights, Contact
- Search icon in navbar
- Premium badge display
- Smooth link transitions with underline animation

**Styling:**
- Gradient logo (blue to indigo)
- Blue brand colors (#blue-600, #indigo-600)
- Framer-motion for animations
- Glassmorphism backdrop blur on scroll

**Used In:**
- Root layout (`app/layout.tsx`) - global placement
- Also manually imported in: insights pages, methodology, how-it-works (redundant)

**NOTE:** Navbar is imported in root layout AND separately in some pages - could consolidate

---

## 8. PAGE STRUCTURE PATTERNS

### Landing Page Pattern (Home)
1. **Hero Section**
   - Title/tagline
   - CTA buttons
   - Trust indicators

2. **Feature Showcase**
   - FeaturesSection component
   - Icon-based cards

3. **Demo/Methodology**
   - DemoSection with animations
   - Interactive walkthroughs

4. **Social Proof**
   - TestimonialsSection
   - TrustBadges

5. **Upload Section**
   - Main upload/analysis area
   - Results display on completion

6. **Additional Sections**
   - AboutSection
   - ContactSection

7. **CTAs**
   - MobileCTA (sticky mobile)
   - RegistrationModal (post-analysis)
   - ExitIntentModal (defined but unused)

### Dashboard Pattern
1. **Resume List**
   - Card-based layout
   - Quick stats
   - Action buttons (analyze, delete, etc.)

2. **Comparison View**
   - Compare multiple resumes
   - Side-by-side analysis

3. **Analysis Results**
   - AI Report + Coach chat
   - Scores and recommendations

### Content Page Pattern
1. **Navbar** (explicit import)
2. **Title/Header**
3. **Content Sections**
4. **CTAs/Next Steps**

---

## 9. API ROUTES STRUCTURE

### Auth Routes
- `/api/auth/[...nextauth]` - NextAuth configuration
- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Registration endpoint
- `/api/auth/logout` - Logout endpoint
- `/api/auth/me` - Current user info

### Analysis Routes
- `/api/analyze` - Resume analysis
- `/api/resumes` - Resume CRUD
- `/api/resumes/[id]` - Single resume
- `/api/resumes/compare` - Compare resumes
- `/api/job-match` - Job matching

### Admin Routes
- `/api/admin/analytics` - Analytics data
- `/api/admin/users` - User management
- `/api/admin/users/[id]` - Single user
- `/api/admin/badges` - Badge management
- `/api/admin/badges/[id]` - Single badge
- `/api/admin/tracking` - Progress tracking

### Other Routes
- `/api/chat/resume-coach` - Coach chat
- `/api/chat-coach` - General chat
- `/api/achievements` - Achievement data
- `/api/badges` - Badge endpoints
- `/api/contact` - Contact form
- `/api/feedback` - User feedback
- `/api/search` - Content search
- `/api/posts` - Blog posts
- `/api/progress` - User progress
- `/api/subscription` - Subscription management

---

## 10. KEY OBSERVATIONS & RECOMMENDATIONS

### Duplicate Navbar Imports
**Issue:** Navbar is imported globally in root layout AND separately in:
- `app/insights/page.tsx`
- `app/insights/[slug]/page.tsx`
- `app/methodology/page.tsx`
- `app/how-it-works/page.tsx`

**Recommendation:** Remove redundant imports - rely on global root layout placement

### ResultsTabs Naming Confusion
**Issue:** Two components with same name in different locations serving different purposes
**Recommendation:** Rename subdirectory version to `ResultsTabNav.tsx` or `ResultsNavigation.tsx`

### ExitIntentModal Not Used
**Issue:** ExitIntentModal component exists but isn't integrated into any pages
**Recommendation:** Either implement it or remove it

### UploadSection Component Size
**Issue:** UploadSection.tsx is 881 lines (largest component)
**Recommendation:** Consider breaking into smaller sub-components:
- `ResumeUploadForm`
- `ProgressIndicator`
- `ResultsDisplay`

### Lucide Icon Consistency
**Status:** Good - consistently using lucide-react across all components
**Icons Used:** ~30 different icons across the app
**Standard Set:** Sparkles, ArrowRight, TrendingUp, Award, Zap, Lock, Target

### Component Organization
**Good Practice:** 
- UI components in `/components/ui/`
- Feature components in `/components/`
- Results variants in `/components/results/`

**Could Improve:**
- Consider sections subdirectory: `/components/sections/` for landing page sections
- Consider layout subdirectory: `/components/layouts/` for page wrappers

