# Manual Testing Guide

## Prerequisites
- Development server running: `npm run dev`
- Browser open to `http://localhost:3000`
- Test resume file ready (PDF or text)

---

## Test Session 1: Happy Path (20 minutes)

### 1. Landing Page
1. Open `http://localhost:3000`
2. Verify hero headline is clear and benefit-focused
3. Verify CTA button is prominent ("Scan My Resume Now")
4. Scroll through entire page
5. Verify all sections load
6. Click "Scan My Resume Now" button

### 2. Upload & Analysis
1. Scroll to upload section
2. Upload a test PDF resume
3. Wait for analysis (should complete in <10 seconds)
4. Verify score displays (0-100)
5. Verify breakdown shows:
   - Structure score
   - Content score
   - Tailoring score
6. Verify recommendations are present
7. Verify actionable suggestions appear

### 3. Text Paste Alternative
1. Scroll to upload section
2. Click in text area
3. Paste resume text
4. Click "Get My Free Score"
5. Wait for analysis
6. Verify results display correctly

### 4. Dashboard Navigation
1. Click dashboard link (if available)
2. Verify stats display
3. Verify resume score shows
4. Verify tasks list present
5. Navigate to different sections

### 5. Jobs Page
1. Go to Jobs page (/jobs)
2. Paste a job description
3. Wait for analysis
4. Verify fit score shows
5. Verify job appears in correct category (Target/Reach/Safety/Avoid)

---

## Test Session 2: Mobile Testing (15 minutes)

### Setup
- Resize browser to 375px width (iPhone)
- Or use Chrome DevTools device simulation (Cmd/Ctrl + Shift + M)

### Tests
1. [ ] Landing page responsive - no horizontal scroll
2. [ ] Navigation menu accessible (hamburger menu if mobile)
3. [ ] Upload interface usable - buttons touchable
4. [ ] Text readable without zooming
5. [ ] All buttons touch-friendly (44px+ height)
6. [ ] Mobile upload message visible ("Tip: For best results, upload from desktop")
7. [ ] Forms work correctly with touch keyboard

---

## Test Session 3: Edge Cases (15 minutes)

### 1. Invalid Upload
- Try uploading .txt file (if PDF only)
- Try uploading file > 5MB
- Try uploading corrupted file
- Verify clear error messages display

### 2. Empty States
- View Jobs page with no jobs added
- View Analytics with no data
- Verify empty states are helpful and encouraging

### 3. Error States
- Try analysis with very short text (< 50 characters)
- Try invalid job description
- Disconnect network and try upload
- Verify error messages are clear and helpful

### 4. PDF Edge Cases
- Upload PDF with only images (scanned) - should give helpful message
- Upload very large PDF (5+ pages)
- Upload PDF with special characters (accents, symbols)

---

## Test Session 4: Copy Verification (10 minutes)

Verify all copy improvements are implemented:

### Landing Page
- [ ] Hero headline: "Land your dream job with AI that understands what hiring managers actually want"
- [ ] Subheadline mentions "Stop guessing" and "beat the applicant tracking systems"
- [ ] CTA button: "Scan My Resume Now"
- [ ] Stats have context (e.g., "Based on anonymised cohort of 1,200 job seekers")

### Upload Section
- [ ] Button text: "Get My Free Score"
- [ ] Mobile camera option is de-emphasized (gray, secondary)
- [ ] Tip text: "For best results, upload a PDF from desktop"
- [ ] Helper text appears when no content: "Upload a PDF or paste your resume text to continue"

### Footer CTA
- [ ] Headline: "Ready to transform your job search?"
- [ ] Button: "Get Started Free"
- [ ] Trust signals: "No credit card required", "Results in 6 minutes", "12,000+ professionals"

---

## Test Session 5: Performance Check (10 minutes)

### Load Times
1. Open browser DevTools (Network tab)
2. Clear cache
3. Load landing page - should be < 3 seconds
4. Load dashboard - should be < 2 seconds

### Interactions
1. Click buttons - should respond instantly (< 100ms)
2. Scroll page - should be smooth, no jank
3. Upload file - progress indicator should be smooth

---

## Issues Found

### Critical (Blocks Launch)
_List any P0 issues found during testing_

1. _______________
2. _______________
3. _______________

### Major (Should Fix Soon)
_List any P1 issues found during testing_

1. _______________
2. _______________
3. _______________

### Minor (Can Fix Post-Launch)
_List any P2 issues found during testing_

1. _______________
2. _______________
3. _______________

---

## Testing Session Sign-Off

**Tester Name:** _______________
**Date:** _______________
**Device/Browser:** _______________

**All Critical Tests Passed:** [ ] YES [ ] NO

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
