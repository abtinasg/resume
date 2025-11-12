# Premium Features Implementation

This document describes the premium features and pricing implementation for ResumeIQ.

## Overview

ResumeIQ now includes a three-tier subscription system:
- **Free**: 3 resume scans per month with basic analysis
- **Premium ($9.99/mo)**: Unlimited scans, advanced features, resume coach chat
- **Pro+ ($19.99/mo)**: Everything in Premium plus custom templates, LinkedIn optimization, priority support

## New Pages

### 1. Pricing Page (`/pricing`)
- **Location**: `app/pricing/page.tsx`
- **Features**:
  - Three-tier pricing cards with feature comparison
  - Monthly/Yearly billing toggle (17% savings)
  - Competitor comparison table
  - FAQ section with 8 common questions
  - Trust indicators (10K+ users, 4.9/5 rating)
  - 14-day money-back guarantee

### 2. How It Works Page (`/how-it-works`)
- **Location**: `app/how-it-works/page.tsx`
- **Features**:
  - 6-step process visualization
  - Interactive step cards with features
  - "Why It Works" section explaining methodology
  - Benefits showcase with statistics
  - Demo video placeholder
  - CTA to upload resume

## New Components

### 1. PremiumBadge (`components/PremiumBadge.tsx`)
**Usage**:
```tsx
import PremiumBadge from '@/components/PremiumBadge';

// Inline badge
<PremiumBadge variant="pro" size="sm" />

// Upgrade prompt
<PremiumBadge
  variant="locked"
  showUpgradeButton={true}
  featureName="Resume Coach Chat"
/>
```

**Variants**:
- `pro`: Gold crown badge for Pro+ users
- `premium`: Purple sparkles for Premium users
- `locked`: Gray lock for unavailable features
- `inline`: Compact inline badge

### 2. ComparisonTable (`components/ComparisonTable.tsx`)
**Usage**:
```tsx
import ComparisonTable from '@/components/ComparisonTable';

<ComparisonTable />
```

Shows feature comparison between ResumeIQ and competitors (Resume Worded, Jobscan, Rezi).

### 3. FeatureGate (`components/FeatureGate.tsx`)
**Usage**:
```tsx
import FeatureGate from '@/components/FeatureGate';
import { FEATURES } from '@/lib/featureGating';

<FeatureGate feature={FEATURES.RESUME_COACH}>
  <ChatBotPanel />
</FeatureGate>
```

Wraps premium features and shows upgrade prompts for free users.

## Feature Gating System

### Auth Store Updates (`lib/store/authStore.ts`)
Added subscription fields to User interface:
```typescript
interface User {
  id: string;
  email: string;
  subscriptionTier?: 'free' | 'premium' | 'pro_plus';
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionEndDate?: string;
  resumeScansRemaining?: number;
}
```

New methods:
- `isPremium()`: Returns true if user is Premium or Pro+
- `isProPlus()`: Returns true if user is Pro+
- `canAccessFeature(feature)`: Check if user can access a specific feature

### Feature Definitions (`lib/featureGating.ts`)
Available features:
```typescript
export const FEATURES = {
  UNLIMITED_SCANS: 'unlimited-scans',
  JOB_MATCHING: 'job-matching',
  RESUME_COACH: 'resume-coach',
  ACHIEVEMENT_BADGES: 'achievement-badges',
  RESUME_COMPARISON: 'resume-comparison',
  CUSTOM_TEMPLATES: 'custom-templates',
  LINKEDIN_OPTIMIZATION: 'linkedin-optimization',
  COVER_LETTER_ANALYSIS: 'cover-letter-analysis',
  PRIORITY_SUPPORT: 'priority-support',
  CONSULTATION: 'consultation',
  VERSION_HISTORY: 'version-history',
};
```

Helper functions:
- `canAccessFeature(userTier, feature)`: Check access
- `getRequiredTier(feature)`: Get minimum tier needed
- `getTierDisplayName(tier)`: Human-readable tier name
- `getFeatureDisplayName(feature)`: Human-readable feature name
- `getUpgradeMessage(feature)`: Generate upgrade prompt text

## Navigation Updates

### Navbar (`components/Navbar.tsx`)
- Updated navigation links:
  - Removed: Features, About, Contact (hash links)
  - Added: "How It Works" → `/how-it-works`
  - Added: "Pricing" → `/pricing`
- Changed "Sign Up" button to "Get Started" → redirects to `/pricing`
- Added premium badge display for authenticated users (shows PRO or PREMIUM badge)

## Example Usage in Dashboard

The dashboard now demonstrates feature gating:

```tsx
// Wrap Resume Coach with feature gate
<FeatureGate feature={FEATURES.RESUME_COACH}>
  <ChatBotPanel resumeContext={resumeContext} />
</FeatureGate>

// Wrap Resume Comparison with feature gate
<FeatureGate feature={FEATURES.RESUME_COMPARISON}>
  <ComparisonView
    resumeId1={selectedForComparison[0]}
    resumeId2={selectedForComparison[1]}
    onClose={closeComparison}
  />
</FeatureGate>
```

## Database Schema Changes Needed

To fully implement subscriptions, update the User model in `prisma/schema.prisma`:

```prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  password             String
  subscriptionTier     String    @default("free") // "free" | "premium" | "pro_plus"
  subscriptionStatus   String?   // "active" | "canceled" | "expired"
  subscriptionEndDate  DateTime?
  resumeScansRemaining Int       @default(3)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // ... existing relations
}
```

Then run:
```bash
npx prisma migrate dev --name add_subscription_fields
```

## API Changes Needed

### 1. Update Auth API (`app/api/auth/me/route.ts`)
Return subscription fields with user data:
```typescript
return NextResponse.json({
  user: {
    id: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier || 'free',
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndDate: user.subscriptionEndDate,
    resumeScansRemaining: user.resumeScansRemaining,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  },
});
```

### 2. Create Subscription API Routes
- `app/api/subscription/checkout/route.ts`: Create Stripe checkout session
- `app/api/subscription/webhook/route.ts`: Handle Stripe webhooks
- `app/api/subscription/portal/route.ts`: Redirect to Stripe customer portal
- `app/api/subscription/cancel/route.ts`: Cancel subscription

### 3. Add Usage Tracking
Update resume analysis API to:
1. Check subscription tier
2. Decrement `resumeScansRemaining` for free users
3. Block analysis if no scans remaining (show upgrade prompt)

## Styling

All components follow the existing design system:
- **Colors**: Indigo/Purple gradients for primary actions
- **Animations**: Framer Motion for smooth transitions
- **Typography**: Inter (body) + Space Grotesk (headings)
- **Patterns**: Glassmorphism, hover effects, gradient backgrounds

## Testing

### Manual Testing Checklist
- [ ] Visit `/pricing` - verify pricing tiers display correctly
- [ ] Toggle monthly/yearly billing - verify prices update
- [ ] View competitor comparison table - verify mobile responsiveness
- [ ] Expand FAQ items - verify smooth animations
- [ ] Visit `/how-it-works` - verify all 6 steps render
- [ ] Navigate to pricing from navbar
- [ ] View premium badge on navbar (requires manual subscription tier update)
- [ ] Test feature gating on dashboard (wrap features with FeatureGate)

### Simulating Premium User
Temporarily update a user's subscription in the database:
```sql
UPDATE User
SET subscriptionTier = 'premium',
    subscriptionStatus = 'active',
    resumeScansRemaining = 999
WHERE email = 'your-test@email.com';
```

## Next Steps

1. **Stripe Integration**:
   - Set up Stripe account
   - Create products and prices
   - Implement checkout flow
   - Set up webhook handling

2. **Usage Limits**:
   - Add scan limit enforcement
   - Display remaining scans to free users
   - Show upgrade prompts when limit reached

3. **Additional Premium Features**:
   - Job description matching
   - Custom resume templates
   - LinkedIn profile optimization
   - Cover letter analysis

4. **Analytics**:
   - Track conversion rates
   - Monitor upgrade funnel
   - A/B test pricing

## Support

For questions or issues:
- Check existing code examples in dashboard
- Review Stripe documentation for payment integration
- Test feature gating thoroughly before production deployment
