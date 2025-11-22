# Rewrite Engine — MVP

## Purpose
Rewrite a single resume bullet into a stronger, role-specific, ATS-safe version without inventing any new facts.

---

## Core Principles
- No fabricated achievements or metrics  
- Preserve original factual meaning  
- Use strong action verbs and clear impact  
- Keep bullets ATS-safe (no tables, emojis, etc.)  
- Deterministic behavior for same input  

---

## Input (MVP)
```ts
export interface RewriteBulletInput {
  bullet: string;             
  targetRole: string;          
  jobDescriptionText?: string; 
  language?: "en" | "fa";      
}
```

---

## Output (MVP)
```ts
export interface RewriteBulletOutput {
  improved: string;          
  reason: string;            
  changeTags: {
    strongerVerb: boolean;
    addedMetric: boolean;
    moreSpecific: boolean;
    removedFluff: boolean;
  };
  estimatedImpact?: "low" | "medium" | "high";
}
```

---

## Example
**Request:**
```json
{
  "bullet": "Worked on API integrations for the product team.",
  "targetRole": "Backend Engineer"
}
```

**Response:**
```json
{
  "improved": "Implemented and maintained REST API integrations used by 5+ internal services, reducing average response time by ~30%.",
  "reason": "Replaced weak verb, added scope and impact, made the result measurable.",
  "changeTags": {
    "strongerVerb": true,
    "addedMetric": true,
    "moreSpecific": true,
    "removedFluff": true
  },
  "estimatedImpact": "high"
}
```

---

## API (MVP)

`POST /api/rewrite/bullet`

### Request Body
```json
{
  "bullet": "...",
  "targetRole": "..."
}
```

### Response Body
`RewriteBulletOutput`

---

## Implementation Notes
- Implement main function in: `lib/rewrite/bullet-rewriter.ts`
- Use existing OpenAI helper in `lib/openai.ts`
- Keep temperature low for deterministic results
- Prompt must explicitly forbid inventing new facts
- Add unit tests with snapshot comparisons
