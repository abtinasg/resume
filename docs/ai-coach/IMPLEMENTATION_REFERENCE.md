# Feature Implementation Reference Guide

## Quick Start for F002-F006 Implementation

### Technology Stack Summary
- **Framework**: Next.js 14.2.18 with App Router
- **Styling**: Tailwind CSS 3.4.15 (no CSS Modules)
- **Components**: Custom UI library (8 primitives)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Form Validation**: Zod
- **State Management**: Zustand

---

## F002: Add Trust Signals to CTAs

### What to Build
Small badges below CTAs showing: "No credit card • Private • 6-min results"

### Implementation Details
```typescript
// New file: components/TrustBadges.tsx
interface TrustBadgesProps {
  variant?: 'compact' | 'full'; // compact: icons only, full: with text
}

// Use these Lucide icons:
- Shield (for privacy)
- Lock (for security)
- Zap (for speed)
- CreditCard (with strikethrough or "no")

// Styling approach:
- Container: flex gap-2 justify-center mt-2 text-xs
- Badge: bg-gray-100 text-gray-600 px-3 py-1 rounded-full
- Icon: inline with text, 16px size
```

### Where to Add
1. Below "Start your free analysis" button in hero (page.tsx)
2. Below "Analyze Another Resume" in UploadSection.tsx
3. Below Contact form submit button
4. Inside Hero features section (adapt styling)

### Effort: 1 day
- Component creation: 30 min
- Integration into 3-4 locations: 30 min
- Testing/refinement: 1 hour

---

## F003: Implement Sticky Mobile CTA

### What to Build
Sticky bottom CTA button that:
- Appears only on mobile after user scrolls past hero section
- Stays visible during page scroll
- Disappears when user scrolls back to top
- Shows "Start your free analysis" or similar action

### Implementation Details
```typescript
// New file: components/MobileCTA.tsx
export function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  
  // Track scroll position
  useEffect(() => {
    const heroHeight = 600; // pixels to scroll before showing
    // Show if scrolled past hero AND scrolling down
    // Hide if at top OR scrolling up
  }, []);
  
  return (
    <motion.div
      initial={{ y: 120 }}
      animate={{ y: isVisible ? 0 : 120 }}
      className="fixed bottom-4 left-4 right-4 md:hidden z-40"
    >
      <button className="w-full py-3 px-4 bg-slate-900 text-white rounded-2xl">
        Start your analysis
      </button>
    </motion.div>
  );
}
```

### Key Considerations
- Position: `fixed bottom-4 left-4 right-4` (respects safe areas on notch devices)
- Z-index: 40 (below navbar at z-50)
- Animation: Slide up/down smoothly
- Don't obstruct critical content on smaller screens
- Add padding-bottom to page when visible

### Effort: 3 days
- Component + scroll detection: 1 day
- Animation refinement: 1 day
- Testing mobile devices: 1 day

---

## F004: Optimize Font Loading

### What to Change
Replace Google Fonts CDN with Next.js font optimization

### Current Code (app/layout.tsx:19-24)
```typescript
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
```

### New Code Pattern
```typescript
import { Inter, Space_Grotesk } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
});

// In layout:
<html className={`${inter.variable} ${spaceGrotesk.variable}`}>
  <body className="font-inter">
```

### Update tailwind.config.ts
```typescript
theme: {
  extend: {
    fontFamily: {
      inter: ['var(--font-inter)', 'system-ui', ...],
      grotesk: ['var(--font-grotesk)', 'system-ui', ...],
    }
  }
}
```

### Effort: 1 day
- Remove CDN links: 15 min
- Import fonts: 15 min
- Update config: 15 min
- Testing: 30 min

---

## F005: Improve SEO Metadata

### What to Update
`app/layout.tsx` metadata object (lines 6-9)

### Current Code
```typescript
export const metadata: Metadata = {
  title: "ResumeIQ",
  description: "AI-powered resume builder",
};
```

### Enhanced Metadata
```typescript
export const metadata: Metadata = {
  title: "ResumeIQ | AI-Powered Resume Analysis & Optimization",
  description: "Get intelligent resume feedback in 6 minutes. Private, secure analysis benchmarked with hiring managers. No credit card required.",
  keywords: [
    "resume analysis",
    "resume optimization",
    "AI resume builder",
    "ATS optimization",
    "resume feedback",
    "job application",
    "career advancement",
  ],
  authors: [{ name: "ResumeIQ" }],
  creator: "ResumeIQ",
  
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://resumeiq.com", // Update with actual domain
    title: "ResumeIQ | AI-Powered Resume Analysis & Optimization",
    description: "Get intelligent resume feedback in 6 minutes. Private, secure analysis.",
    siteName: "ResumeIQ",
    images: [{
      url: "https://resumeiq.com/og-image.png", // Create this image
      width: 1200,
      height: 630,
      alt: "ResumeIQ - AI Resume Analysis",
    }],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "ResumeIQ | AI-Powered Resume Analysis",
    description: "Intelligent resume feedback in 6 minutes.",
    creator: "@resumeiq",
    images: ["https://resumeiq.com/twitter-image.png"],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};
```

### Additional Recommendations
- Add canonical URL in metadata
- Create JSON-LD structured data for Organization schema
- Add sitemap.xml in app directory
- Add robots.txt for SEO

### Effort: 1 day
- Metadata expansion: 30 min
- Asset creation (OG image): 1-2 hours (design work)
- Structured data: 1 hour
- Testing with SEO tools: 30 min

---

## F006: Add Social Proof Section

### What to Build
Testimonials section with 3-5 customer success stories showing:
- Profile photo/avatar
- Name and job title
- Short quote
- Success metric (e.g., "+38% interview invites")

### File Structure
```typescript
// New file: components/TestimonialsSection.tsx
interface Testimonial {
  id: string;
  name: string;
  title: string;
  company?: string;
  image: string; // URL to photo
  quote: string;
  metric: string;
  metricLabel: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "Product Manager",
    company: "TechCorp",
    image: "/testimonials/sarah.jpg",
    quote: "ResumeIQ helped me identify gaps I couldn't see myself. Got 3 interviews in the first week.",
    metric: "+65%",
    metricLabel: "Interview invites",
  },
  // ... more testimonials
];
```

### Design Pattern (Follow FeaturesSection)
```typescript
// Use this structure:
<section className="py-32 bg-gradient-to-b from-white to-gray-50">
  <div className="max-w-7xl mx-auto px-6 md:px-12">
    {/* Header */}
    <motion.div className="text-center mb-20">
      <h2 className="font-grotesk text-5xl lg:text-6xl font-bold">
        Success Stories
      </h2>
    </motion.div>
    
    {/* Grid: 1 col mobile, 2-3 cols desktop */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <motion.div key={testimonial.id} /* stagger animation */ >
          <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-8">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <img src={testimonial.image} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.title}</p>
              </div>
            </div>
            
            {/* Quote */}
            <p className="mt-6 text-gray-700 leading-relaxed">"{testimonial.quote}"</p>
            
            {/* Metric */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-3xl font-bold text-brand-indigo">{testimonial.metric}</p>
              <p className="text-xs text-gray-600 mt-1">{testimonial.metricLabel}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>
```

### Positioning in page.tsx
Add after DemoSection, before ContactSection:
```typescript
<TestimonialsSection />
```

### Effort: 3 days
- Component creation: 1 day
- Testimonial data collection: 1 day (depends on asset availability)
- Design/styling refinement: 1 day
- Mobile testing: 0.5 day

---

## Implementation Order Recommendation

**Priority 1 (Quick wins):**
1. F004: Optimize Font Loading (1 day) - Performance boost
2. F005: Improve SEO Metadata (1 day) - SEO benefits

**Priority 2 (Trust & Conversion):**
3. F002: Add Trust Signals to CTAs (1 day) - Conversion improvement
4. F006: Add Social Proof Section (3 days) - Credibility & social proof

**Priority 3 (Mobile Experience):**
5. F003: Implement Sticky Mobile CTA (3 days) - Mobile conversions

---

## Testing Checklist

### General Testing
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Animation performance (no janky scrolling)
- [ ] Cross-browser compatibility (Chrome, Safari, Firefox, Edge)
- [ ] Lighthouse performance score > 90
- [ ] Accessibility (keyboard navigation, screen reader)

### For Each Feature
- [ ] F002: Trust badges visible/readable at all viewport sizes
- [ ] F003: Sticky CTA doesn't overlap critical content, smooth animations
- [ ] F004: Fonts load correctly, FOUT not noticeable
- [ ] F005: OG tags render in social media previews
- [ ] F006: Images load optimized, grid responsive

---

## Common Patterns to Follow

### Animation Pattern (Framer Motion)
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.8, delay: index * 0.1 }}
>
  Content
</motion.div>
```

### Tailwind Color Classes
```typescript
// Brand colors:
bg-brand-indigo, text-brand-indigo, border-brand-indigo
bg-brand-teal, text-brand-teal, border-brand-teal

// Shadows:
shadow-glow, shadow-glow-sm, shadow-ambient

// Glassmorphism:
bg-white/70 backdrop-blur-xl border border-white/60
```

### Icon Usage (Lucide React)
```typescript
import { ShieldCheck, Lock, Zap } from 'lucide-react';

<ShieldCheck className="w-5 h-5 text-brand-indigo" strokeWidth={2.4} />
```

---

## File Paths Reference

### Files to Create
- `/home/user/resume/components/TrustBadges.tsx` (F002)
- `/home/user/resume/components/MobileCTA.tsx` (F003)
- `/home/user/resume/components/TestimonialsSection.tsx` (F006)

### Files to Modify
- `/home/user/resume/app/layout.tsx` (F004, F005)
- `/home/user/resume/app/page.tsx` (add F002, integrate F003, F006)
- `/home/user/resume/tailwind.config.ts` (F004)

