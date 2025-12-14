# Layer 3 – Execution Engine (Rewrite)
## Complete Specification v2.1 (MVP + Roadmap)

**Version:** 2.1  
**Status:** Implementation-Ready  
**Last Updated:** December 15, 2025  
**Scope:** Resume rewriting (bullets, summary, section)

---

## Document Purpose

Single source of truth for Layer 3 Execution Engine development.

**Part I:** MVP Implementation (v2.1) - ready to code now  
**Part II:** Post-MVP Roadmap - what's coming next

---

# PART I: MVP IMPLEMENTATION

## 0. Purpose & Role

Layer 3 executes resume improvements based on analysis from Layer 1/2 and decisions from Layer 5 (Orchestrator).

**Primary function:** Rewrite weak resume content to be stronger, clearer, more impactful.

**Key innovation:** Evidence-Anchored Rewriting - every claim must be traceable to source evidence.

**Non-responsibilities:**
- Does NOT decide what to rewrite (Layer 5 decides)
- Does NOT score resumes (Layer 1 does)
- Does NOT generate cover letters (future scope)
- Does NOT handle job applications (future scope)

---

## 1. Design Principles

**Truthfulness by Construction**
- Every improved claim must have an evidence anchor
- Evidence Ledger tracks all allowed facts
- Validation enforces no-fabrication automatically

**Deterministic & Testable**
- Rule-based planning + low-temp LLM generation
- Same input + config → stable output
- All thresholds configurable

**Explainable & Auditable**
- Return reasoning, change flags, evidence map
- Users can see "where did this come from"
- Validation reports show what passed/failed

**ATS-Safe**
- Plain text only, no tables/emojis/special chars

**Graceful Degradation**
- If evidence insufficient → ask user for input
- Never hallucinate to fill gaps

---

## 2. Evidence-Anchored Rewriting

### 2.1 The Problem

Traditional resume rewriters fabricate: "40%", "5 engineers", "10x faster" because it sounds impressive.

### 2.2 The Solution

**Evidence Ledger:** Structured list of allowed facts

```ts
interface EvidenceItem {
  id: string;                    // "E1", "E2", ...
  scope: "bullet" | "section" | "resume";
  source: "bullet" | "section" | "resume";
  text: string;                  // raw evidence text
  normalized_terms?: string[];   // extracted keywords
}

interface EvidenceMapItem {
  improved_span: string;         // phrase in rewrite
  evidence_ids: string[];        // ["E2","E5"] where it came from
}
```

### 2.3 Example

```
Original bullet:
"Worked on API integrations"

Evidence Ledger:
E1 (bullet): "Worked on API integrations"
E2 (section, other bullet): "Supported 5+ internal services"
E3 (resume, skills): ["REST", "Node.js"]

Improved:
"Developed REST API integrations supporting 5+ internal services"

Evidence Map:
- "Developed" → [E1] (verb upgrade)
- "REST API" → [E3] (from resume skills)
- "supporting 5+ internal services" → [E2] (from section)
```

**Key insight:** Every phrase traces to evidence. No fabrication possible.

---

## 3. Inputs

### 3.1 Request Schema

```ts
type RewriteType = "bullet" | "summary" | "section";
type EvidenceScope = "bullet_only" | "section" | "resume";

interface RewriteRequest {
  type: RewriteType;
  
  // Content
  bullet?: string;
  summary?: string;
  bullets?: string[];              // for section
  
  // Context
  target_role?: string;
  target_seniority?: "entry"|"mid"|"senior"|"lead";
  job_description?: string;        // optional, style guide only
  
  // Evidence
  evidence?: EvidenceItem[];       // precomputed (optional)
  evidence_scope?: EvidenceScope;  // default: "section"
  allow_resume_enrichment?: boolean; // default: true
  
  // Signals from other layers
  layer1?: {
    weak_bullets?: Array<{
      bullet: string;
      index?: number;
      issues: string[];  // ["weak_verb", "no_metric", "too_vague"]
    }>;
    extracted?: {
      skills?: string[];
      tools?: string[];
      titles?: string[];
    };
  };
  
  layer2?: {
    target_role?: string;
    missing_experience_types?: string[];  // context only, don't fabricate
    critical_missing_skills?: string[];   // context only
  };
}
```

### 3.2 Evidence Sources (Allowed Facts)

**bullet_only:** Safest, minimal enrichment  
**section:** May use facts from other bullets in same role  
**resume:** May use skills/tools from resume-wide lists (via Layer 1 extracted)

**Job Description:** NEVER a factual source. Only for:
- Preferred terminology
- Priority ordering
- Style guidance

---

## 4. Outputs

```ts
interface ValidationItem {
  code: string;                    // e.g., "NEW_NUMBER_ADDED"
  severity: "info" | "warning" | "critical";
  message: string;
}

interface RewriteQualitySignals {
  stronger_verb: boolean;
  added_metric: boolean;           // only if already implied
  more_specific: boolean;
  removed_fluff: boolean;
  tailored_to_role: boolean;
}

interface BulletRewriteResult {
  original: string;
  improved: string;
  
  reasoning: string;               // 1-2 sentences
  changes: RewriteQualitySignals;
  
  // NEW: Evidence tracking
  evidence_map: EvidenceMapItem[]; // audit trail
  
  validation: {
    passed: boolean;
    items: ValidationItem[];
  };
  
  confidence: "low" | "medium" | "high";
  
  needs_user_input?: Array<{
    prompt: string;                // "What metrics can you add?"
    example_answer?: string;
  }>;
  
  estimated_score_gain?: number;   // 0-10
}

interface SectionRewriteResult {
  original_bullets: string[];
  improved_bullets: BulletRewriteResult[];
  section_notes: string[];         // e.g., "Unified tense to past"
  
  validation: {
    passed: boolean;
    items: ValidationItem[];
  };
  
  confidence: "low" | "medium" | "high";
}
```

---

## 5. Rewrite Pipeline (7 Steps)

### Step 1: Preprocess
```
- Detect language (if not provided)
- Normalize whitespace
- Strip illegal characters
- Detect dominant tense (for sections)
```

### Step 2: Build Evidence Ledger

If `request.evidence` not provided:

```python
def build_evidence_ledger(request):
    ledger = []
    
    # E1: Bullet itself
    if request.bullet:
        ledger.append(EvidenceItem(
            id="E1",
            scope="bullet",
            source="bullet",
            text=request.bullet
        ))
    
    # E2-En: Section bullets
    if request.evidence_scope in ["section", "resume"]:
        for i, bullet in enumerate(other_bullets_in_section):
            ledger.append(EvidenceItem(
                id=f"E{i+2}",
                scope="section",
                source="section",
                text=bullet
            ))
    
    # Resume-level: from Layer 1 extracted
    if request.allow_resume_enrichment and request.layer1.extracted:
        ledger.append(EvidenceItem(
            id="E_skills",
            scope="resume",
            source="resume",
            text=", ".join(request.layer1.extracted.skills)
        ))
    
    return ledger
```

### Step 3: Classify & Plan

```ts
interface RewritePlan {
  goal: "impact" | "clarity" | "ats" | "conciseness";
  issues: string[];              // from Layer 1
  
  transformations: Array<
    | { type: "verb_upgrade"; from?: string; to: string }
    | { type: "remove_fluff"; terms: string[] }
    | { type: "add_how"; hint: string }
    | { type: "surface_tool"; tool: string; evidence_id: string }
    | { type: "tense_align"; tense: "past"|"present" }
  >;
  
  constraints: {
    max_length: number;          // default: 200 chars
    forbid_new_numbers: boolean;
    forbid_new_tools: boolean;
    forbid_new_companies: boolean;
  };
}
```

**Planning algorithm:**

```python
def create_plan(bullet, layer1_issues, evidence_ledger):
    plan = RewritePlan(issues=layer1_issues)
    
    # Issue: weak_verb
    if "weak_verb" in layer1_issues:
        weak_verb = detect_weak_verb(bullet)
        strong_verb = select_strong_verb(weak_verb, context)
        plan.transformations.append({
            "type": "verb_upgrade",
            "from": weak_verb,
            "to": strong_verb
        })
    
    # Issue: no_metric
    if "no_metric" in layer1_issues:
        # Don't add numbers, add HOW
        plan.transformations.append({
            "type": "add_how",
            "hint": "Explain the method/approach used"
        })
    
    # Check: can we surface tools from resume?
    for evidence in evidence_ledger:
        if evidence.scope == "resume" and "skills" in evidence.text:
            tools = extract_tools(evidence.text)
            for tool in tools:
                if tool_relevant_to_bullet(tool, bullet):
                    plan.transformations.append({
                        "type": "surface_tool",
                        "tool": tool,
                        "evidence_id": evidence.id
                    })
    
    return plan
```

### Step 4: Generate (LLM)

**Prompt structure:**

```
You are rewriting a resume bullet. You MUST use ONLY the evidence provided.

ORIGINAL:
{bullet}

TARGET ROLE: {target_role}

REWRITE PLAN:
{plan.transformations}

EVIDENCE LEDGER:
{for each evidence: "ID: {id}, Text: {text}"}

STRICT RULES:
1. Do NOT add numbers not in evidence
2. Do NOT add tools not in evidence
3. Every improvement must map to evidence IDs

OUTPUT (JSON):
{
  "improved": "...",
  "evidence_map": [
    {"improved_span": "...", "evidence_ids": ["E1","E3"]},
    ...
  ],
  "reasoning": "...",
  "changes": {...}
}
```

**Model config:**
- Primary: GPT-4o-mini
- Temperature: 0.2
- Max tokens: 250

### Step 5: Validate (Hard Rules)

```python
def validate_rewrite(original, improved, evidence_ledger):
    warnings = []
    
    # Critical: No new numbers
    orig_numbers = extract_numbers(original)
    evidence_numbers = extract_all_numbers(evidence_ledger)
    improved_numbers = extract_numbers(improved)
    
    new_numbers = improved_numbers - (orig_numbers ∪ evidence_numbers)
    if new_numbers:
        warnings.append(ValidationItem(
            code="NEW_NUMBER_ADDED",
            severity="critical",
            message=f"Added numbers not in evidence: {new_numbers}"
        ))
    
    # Critical: No new tools
    orig_tools = extract_tech_terms(original)
    evidence_tools = extract_all_tools(evidence_ledger)
    improved_tools = extract_tech_terms(improved)
    
    new_tools = improved_tools - (orig_tools ∪ evidence_tools)
    if new_tools:
        warnings.append(ValidationItem(
            code="NEW_TOOL_ADDED",
            severity="critical",
            message=f"Added tools not in evidence: {new_tools}"
        ))
    
    # Warning: Too long
    if len(improved) > len(original) * 2:
        warnings.append(ValidationItem(
            code="LENGTH_EXPLOSION",
            severity="warning",
            message="Rewrite significantly longer than original"
        ))
    
    # Warning: Meaning shift
    similarity = semantic_similarity(original, improved)
    if similarity < 0.78:
        warnings.append(ValidationItem(
            code="MEANING_SHIFT",
            severity="warning",
            message="Meaning changed significantly"
        ))
    
    passed = not any(w.severity == "critical" for w in warnings)
    return {"passed": passed, "items": warnings}
```

### Step 6: Repair / Retry

```python
MAX_RETRIES = 2

def rewrite_with_retry(request):
    for attempt in range(MAX_RETRIES):
        result = generate_rewrite(request)
        validation = validate_rewrite(result)
        
        if validation.passed:
            return result
        
        if attempt < MAX_RETRIES - 1:
            # Add validation errors to prompt
            request.constraints.add_failures(validation.items)
            continue
        else:
            # Give up, return original with warnings
            return fallback_result(request.original, validation.items)
```

### Step 7: Section Coherence Pass

For section rewrites:

```python
def rewrite_section_coherent(bullets, context):
    # Detect section style
    dominant_tense = detect_tense(bullets)
    dominant_style = detect_style(bullets)
    
    improved = []
    used_starts = set()
    
    for i, bullet in enumerate(bullets):
        # Rewrite with context
        result = rewrite_bullet(
            bullet,
            context={
                **context,
                "tense": dominant_tense,
                "previous_bullets": improved,
                "avoid_starts": used_starts
            }
        )
        
        improved.append(result)
        used_starts.add(get_first_word(result.improved))
    
    # Post-process: unify formatting
    improved = unify_tense(improved, dominant_tense)
    improved = unify_formatting(improved)
    
    return improved
```

---

## 6. No-Fabrication Rules

### 6.1 Metrics

**Rule:** If exact number exists → keep it. If vague → add HOW, not number.

```
❌ "Improved performance" → "Improved performance by 40%"
✅ "Improved performance" → "Improved performance through database indexing"
✅ "Reduced costs" → "Reduced infrastructure costs by migrating to cheaper provider"
```

### 6.2 Tools/Skills

**Rule:** Only add if exists in evidence ledger (resume skills/tools list)

```
Evidence: skills: ["Python", "SQL", "Docker"]

❌ "Worked on backend" → "Built REST APIs with Node.js" (Node not in evidence)
✅ "Worked on backend" → "Developed Python-based backend services" (Python in evidence)
```

### 6.3 Soft Skills

**Rule:** Don't inject unless explicitly supported by bullet text

```
❌ "Team member" → "Excellent communicator and team player"
✅ "Team member" → "Collaborated with cross-functional team"
```

### 6.4 Seniority Claims

**Rule:** Don't add "Senior", "Lead" unless in titles evidence

```
Evidence: titles: ["Software Engineer"]

❌ "Engineer at Company" → "Senior Software Engineer at Company"
✅ "Engineer at Company" → "Software Engineer at Company"
```

---

## 7. Core Algorithms

### 7.1 Weak Verb → Strong Verb

```python
VERB_MAPPINGS = {
    'worked on': {
        'software/code': 'developed',
        'feature/product': 'built',
        'system': 'implemented',
        'default': 'developed'
    },
    'helped': {
        'team': 'supported',
        'project': 'contributed to',
        'process': 'facilitated',
        'default': 'supported'
    },
    'responsible for': {
        'team': 'managed',
        'project': 'led',
        'system': 'owned',
        'default': 'led'
    }
}

def select_strong_verb(weak_verb, context):
    mappings = VERB_MAPPINGS.get(weak_verb, {})
    
    # Check context for keywords
    for keyword, strong_verb in mappings.items():
        if keyword in context.lower():
            return strong_verb
    
    return mappings.get('default', weak_verb)
```

### 7.2 Metric Detection

```python
def detect_metric(text):
    patterns = [
        r'\d+%',                          # 40%
        r'\$\d+[KMB]?',                   # $5K, $2M
        r'\d+\s*(users|customers)',       # 10K users
        r'\d+x',                          # 10x faster
        r'\d+\s*(hours|days|weeks)',      # 2 weeks
    ]
    
    # Implied metrics (words)
    implied = ['doubled', 'tripled', 'halved', 'millions']
    
    for pattern in patterns:
        if re.search(pattern, text):
            return True
    
    for word in implied:
        if word in text.lower():
            return True
    
    return False
```

### 7.3 Fluff Removal

```python
FLUFF_WORDS = [
    'various', 'numerous', 'multiple', 'several',
    'etc.', 'and more', 'among others',
    'responsible for', 'tasked with', 'duties included'
]

def remove_fluff(text):
    for fluff in FLUFF_WORDS:
        text = text.replace(fluff, '')
    
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
```

---

## 8. Configuration

```json
{
  "version": "2.1",
  "defaults": {
    "evidence_scope": "section",
    "allow_resume_enrichment": true
  },
  "llm": {
    "primary_model": "gpt-4o-mini",
    "fallback_model": "gpt-3.5-turbo",
    "temperature": 0.2,
    "max_tokens": 250,
    "max_retries": 2
  },
  "thresholds": {
    "max_length_multiplier": 2.0,
    "min_bullet_length": 20,
    "max_bullet_length": 200,
    "semantic_similarity_min": 0.78
  },
  "features": {
    "evidence_anchored_rewrite": true,
    "section_coherence_pass": true,
    "meaning_shift_check": true
  },
  "lists": {
    "fluff_words": ["various", "numerous", ...],
    "hype_words": ["synergy", "rockstar", ...]
  }
}
```

---

## 9. API Endpoints

### POST /api/rewrite/bullet

```
Request:
{
  "bullet": "Worked on API integrations for product team",
  "target_role": "Backend Engineer",
  "layer1": {
    "issues": ["weak_verb", "no_metric"],
    "extracted": {
      "skills": ["Python", "REST", "Docker"]
    }
  }
}

Response:
{
  "original": "Worked on API integrations for product team",
  "improved": "Developed REST API integrations supporting product features",
  "changes": {
    "stronger_verb": true,
    "more_specific": true
  },
  "evidence_map": [
    {
      "improved_span": "Developed",
      "evidence_ids": ["E1"]
    },
    {
      "improved_span": "REST API",
      "evidence_ids": ["E_skills"]
    }
  ],
  "reasoning": "Upgraded weak verb 'Worked on' to 'Developed', added specificity",
  "validation": {
    "passed": true,
    "items": []
  },
  "confidence": "high",
  "estimated_score_gain": 5
}
```

### POST /api/rewrite/section

```
Request:
{
  "bullets": [
    "Worked on backend systems",
    "Helped with API development",
    "Responsible for database optimization"
  ],
  "target_role": "Backend Engineer"
}

Response:
{
  "original_bullets": [...],
  "improved_bullets": [
    {...},
    {...},
    {...}
  ],
  "section_notes": ["Unified tense to past", "Strengthened all verbs"],
  "validation": {
    "passed": true,
    "items": []
  },
  "confidence": "high"
}
```

---

## 10. Integration with Other Layers

### Called By: Layer 5 (Orchestrator)

```python
# Orchestrator decides WHAT to rewrite
if strategy_mode == "IMPROVE_RESUME_FIRST":
    weak_bullets = layer1.get_weak_bullets(top_n=3)
    
    for bullet_data in weak_bullets:
        result = layer3.rewrite_bullet(
            bullet=bullet_data.bullet,
            layer1={
                "issues": bullet_data.issues,
                "extracted": layer1.extracted
            },
            layer2={
                "target_role": user_profile.target_role
            }
        )
        
        # Apply if score gain significant
        if result.estimated_score_gain >= 3:
            apply_rewrite(result)
```

---

## 11. Edge Cases & Fallbacks

**Case 1: No improvable content**
```
Input: "Led development of REST API serving 1M+ requests/day, reducing latency by 40%"
Output: {
  "original": "...",
  "improved": "...", (same)
  "needs_user_input": [],
  "reasoning": "Bullet already strong, no changes needed",
  "confidence": "high"
}
```

**Case 2: Insufficient evidence**
```
Input: "Did coding"
Output: {
  "improved": "Developed software solutions",
  "needs_user_input": [{
    "prompt": "What technologies did you use?",
    "example_answer": "Python, React, PostgreSQL"
  }, {
    "prompt": "What did you build?",
    "example_answer": "Built customer dashboard"
  }],
  "confidence": "low"
}
```

**Case 3: Validation fails**
```
LLM adds: "Improved performance by 40%"
Validation: CRITICAL - "NEW_NUMBER_ADDED"
Action: Retry with stricter constraints
If still fails: Return original + warning
```

**Case 4: Section all strong**
```
Action: Return original bullets
Note: "All bullets already well-written"
```

---

## 12. Success Metrics

**Quality:**
- 90%+ rewrites improve score by 3+ points
- <5% fabrication rate (caught by validation)
- <10% user rejection rate

**Performance:**
- <3s per bullet
- <10s per section (parallel)
- 95%+ success rate (no errors)

**User:**
- 70%+ acceptance rate
- 80%+ report "sounds like me"
- Interview rate improvement after rewrites

---

## 13. Testing Requirements

### Unit Tests
```python
test_evidence_ledger_building()
test_weak_verb_upgrade()
test_metric_detection()
test_fabrication_detection()
test_validation_rules()
```

### Golden Tests
```python
GOLDEN_CASES = [
    {
        "input": "Worked on API integrations",
        "evidence": ["REST", "Node.js"],
        "expected_improvements": ["stronger_verb", "surface_tool"],
        "forbidden": ["new_numbers", "new_companies"]
    },
    # 50+ cases
]
```

### Integration Tests
```python
test_orchestrator_integration()
test_layer1_rescoring_loop()
test_retry_mechanism()
test_section_coherence()
```

---

## 14. Implementation Checklist

**Week 1:**
- [ ] Implement evidence ledger building
- [ ] Implement weak verb mapping with context
- [ ] Implement metric detection
- [ ] Implement fluff removal
- [ ] Unit tests

**Week 2:**
- [ ] Implement LLM prompt with evidence
- [ ] Implement validation with evidence checking
- [ ] Implement retry mechanism
- [ ] Implement API endpoints
- [ ] Integration tests

**Week 3:**
- [ ] Implement section coherence pass
- [ ] Integrate with Layer 1 (get weak bullets)
- [ ] Integrate with Layer 5 (receive requests)
- [ ] Golden test suite
- [ ] Performance optimization

**Estimated:** 2-3 weeks (8-12 developer-days)

---

# PART II: POST-MVP ROADMAP

## Phase 2: Enhanced Features (Weeks 9-12)

### 2.1 Multi-Variant Generation

Generate 2-3 rewrite options, let Layer 1 rescore and pick best.

```ts
interface VariantRewriteResult {
  variants: Array<{
    improved: string;
    style: "metrics_focused" | "leadership_focused" | "technical_focused";
    score_estimate: number;
  }>;
  recommended_index: number;
}
```

### 2.2 Style Presets

Different rewrite strategies per industry:

```python
STYLE_PRESETS = {
    "pm": {
        "focus": "cross_functional_impact",
        "prefer_metrics": "user_outcomes",
        "verb_style": "leadership"
    },
    "swe": {
        "focus": "technical_depth",
        "prefer_metrics": "performance_scale",
        "verb_style": "technical"
    },
    "sales": {
        "focus": "revenue_customer",
        "prefer_metrics": "dollars_percentage",
        "verb_style": "achievement"
    }
}
```

### 2.3 Job-Specific Tailoring

Use JD keywords for priority (still evidence-constrained):

```python
def prioritize_transformations(plan, jd_keywords):
    # If JD mentions "scalability" heavily
    # And resume has "scaled system" evidence
    # Prioritize bringing that forward
    
    for keyword in jd_keywords.top_10:
        if keyword in evidence_ledger:
            plan.transformations.prepend({
                "type": "surface_keyword",
                "keyword": keyword,
                "evidence_id": find_evidence(keyword)
            })
```

---

## Phase 3: Advanced Features (Months 4-6)

### 3.1 Persian Support

Activate full Persian support:
- Persian prompts
- Persian verb mappings
- Persian fluff words
- Bi-directional support

### 3.2 Interactive Improvement Loop

When evidence insufficient, create structured questions:

```ts
interface UserInputRequest {
  question_id: string;
  prompt: string;
  expected_type: "number" | "text" | "choice";
  choices?: string[];
  example?: string;
}

// Example
{
  "question_id": "metric_1",
  "prompt": "How many users/customers were affected?",
  "expected_type": "choice",
  "choices": ["10-100", "100-1K", "1K-10K", "10K+"]
}
```

### 3.3 Meaning-Shift Detection (ML)

Use embeddings to detect semantic drift:

```python
def detect_meaning_shift(original, improved):
    orig_embedding = embed(original)
    improved_embedding = embed(improved)
    
    similarity = cosine_similarity(orig_embedding, improved_embedding)
    
    if similarity < 0.75:
        return {
            "shifted": True,
            "confidence": 1 - similarity,
            "recommendation": "Review manually"
        }
```

---

## Phase 4: Intelligent Features (Months 6+)

### 4.1 Cover Letter Generation

Extend to cover letters (separate scope):
- Use resume evidence + job posting
- Structure: intro, body (3 bullets), closing
- Evidence-anchored (no fabrication)

### 4.2 LinkedIn Optimization

Apply same rewrite logic to LinkedIn:
- Headline optimization
- About section
- Experience bullets (cross-sync with resume)

### 4.3 Learning from Outcomes

Track which rewrites correlate with interviews:

```python
def learn_from_outcomes(rewrite_log, interview_outcomes):
    # Which transformations work best?
    # Which evidence sources most valuable?
    # Which validation rules too strict/loose?
    
    insights = analyze_correlation(rewrite_log, interview_outcomes)
    
    # Update config weights
    update_transformation_weights(insights)
```

---

**END OF SPECIFICATION**

**Version:** 2.1  
**Status:** Implementation-Ready  
**Next:** External review (optional) → Start coding
