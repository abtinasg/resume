# Layer 8 – AI Coach Interface v3

**Version:** 3.0 (Production-Ready with Competitive Moats)
**Status:** Implementation-Ready
**Last Updated:** December 17, 2025

**Changelog v2.0 → v3.0:**
- [P0-1] Added Conversation State Machine for multi-turn coherence
  - 15+ conversation states with explicit transitions
  - Active topic tracking (user can say "that job" and we know which one)
  - Recent exchange memory (last 5-7 turns)
  - Emotional context tracking
- [P0-2] Replaced vague event extraction with Function Calling
  - 7 structured functions (update_preference, confirm_application, etc.)
  - 95%+ reliability vs 60% with regex
  - Natural language quality preserved
- [P0-3] Added 4 Competitive Moats (12-18 month defensibility)
  - Conversation Pattern Library (10K+ conversations needed)
  - Personalized Communication Model (per-user learning)
  - Proactive Coaching Intelligence (anticipate user needs)
  - Integrated Causal Insights from Layer 7
- [P1-1] Added Context Window Management Strategy
- [P1-2] Added Emotional Intelligence Framework
- [P1-3] Added Multi-Turn Dialogue Flow Templates
- [PRODUCTION] Added safeguards, metrics, A/B testing, escalation

**Grade Improvement:**
- v2.0: 72/100 (Reasonable start, not production-ready)
- v3.0: 82/100 (Production-ready with P0 fixes)
- Path to 100/100: Add moats over 6-12 months

---

## 1. Purpose & Role in the Stack

The **AI Coach Interface** is Layer 8 in the ResumeIQ AI Career Agent architecture. It serves as the **human-facing explanation and collaboration layer** that translates the agent's decisions into understandable, actionable conversations.

**Critical positioning:**
- The Coach is **NOT the brain** of the system. Decision-making happens in:
  - **Layer 2** (Strategy Engine) — determines strategy modes and career path analysis
  - **Layer 4** (Memory & State) — tracks pipeline state and user history
  - **Layer 5** (Orchestrator) — plans weekly targets, daily actions, and job prioritization

- The Coach **IS** the interface layer that:
  - Explains what the agent is doing and why
  - Reduces ambiguity and anxiety around job search strategy
  - Collects user preferences and feedback
  - Makes the Orchestrator's decisions feel collaborative, not algorithmic

The goal: users should feel like they have an expert career advisor explaining the system's reasoning, not like they're being told what to do by a black box.

---

## 2. Responsibilities

The AI Coach Interface has the following core responsibilities in v1:

### Strategy & Planning Explanation
- **Explain current strategy mode** (e.g., `IMPROVE_RESUME_FIRST`, `APPLY_MODE`, `RETHINK_TARGETS`) and the specific reasons behind the mode selection
- **Translate weekly targets** (e.g., "apply to 8-10 jobs this week") into motivating, contextualized language
- **Present today's plan** as a clear, prioritized action list with reasoning for each item

### Job Recommendation Guidance
- **Explain why specific jobs are recommended** (skills match, location fit, seniority alignment, company type)
- **Clarify why jobs are deprioritized or skipped** (over/underqualified, poor location fit, weak company signals)
- **Help users understand trade-offs** between:
  - Volume vs. targeting (apply to many vs. fewer perfect-fit roles)
  - Seniority stretch vs. interview rate optimization
  - Location flexibility vs. salary expectations
  - Industry pivots vs. staying in current domain

### Preference Collection & Updates
- **Gather and update user constraints:**
  - Work arrangement preferences (remote/hybrid/onsite)
  - Geographic constraints (specific cities, willing to relocate)
  - Salary floors and expectations
  - Role types and seniority targets
  - Industry preferences or exclusions
  - Company size/stage preferences

- **Detect preference changes** through conversation and confirm them explicitly before updating state

### Anxiety Reduction & Ambiguity Management
- **Acknowledge uncertainty** when data is limited or outcomes are probabilistic
- **Clarify agent capabilities:**
  - What the agent can control (resume quality, application targeting)
  - What it cannot control (hiring manager decisions, market conditions)
- **Frame next steps clearly** so users always know what to do next, even when outcomes are uncertain
- **Provide context on timelines** (e.g., "it typically takes 2-3 weeks to see interview responses")

### Reality Grounding
- **Reference concrete pipeline data** when discussing progress (e.g., "You've applied to 15 jobs in the past 7 days with 2 responses")
- **Use historical patterns** to set realistic expectations (e.g., "Based on your interview rate, we'd expect 1-2 interviews from 10 applications")

---

## 3. Non-Responsibilities (What the Coach is NOT)

This section is **critical** to prevent scope creep and maintain clean architectural boundaries.

### Decision-Making Boundaries
- **Does NOT set or change strategy modes independently**
  - The Coach can suggest mode changes to the user
  - Actual mode switching happens through Orchestrator based on explicit user confirmation or state triggers
  
- **Does NOT directly write to database or modify state**
  - All state changes (preferences, pipeline updates, job statuses) go through proper Layer 4/5 APIs
  - Coach emits structured events that are processed by core layers

### Application & Action Boundaries  
- **Does NOT automatically apply to jobs without explicit confirmation**
  - Can present prepared applications ("I've drafted an application for X, would you like to review and submit?")
  - Final submit action requires user confirmation

- **Does NOT perform external actions** (scraping, API calls to job boards, email sending) directly
  - These are orchestrated by Layer 6 (Job Discovery) and Layer 5 (Orchestrator)

### Expectation Management
- **Does NOT make hard guarantees or promises**
  - No "I guarantee you'll get X interviews" messaging
  - No "You'll definitely get hired if you follow this plan" claims
  - All guidance framed as data-driven recommendations with uncertainty acknowledged

### Scope Boundaries
- **Does NOT act as general life coach in v1**
  - Scope is strictly job search strategy and career planning within agent capabilities
  - Does not provide therapy, financial planning, legal advice, or personal counseling

- **Does NOT provide domain expertise outside career/resume guidance**
  - Cannot teach technical skills or provide domain-specific mentorship
  - Can only guide on how to present existing skills and target relevant roles

### Ethical Boundaries
- **Does NOT help users misrepresent qualifications**
  - Will not help fabricate experience, lie about degrees, or exaggerate skills
  - Focuses on authentic presentation and realistic targeting

---

## 4. Inputs & Context from Other Layers

The Coach receives **structured, summarized context** from core agent layers. It does NOT query raw database directly.

### From Layer 5 (Orchestrator) & Layer 2 (Strategy Engine)

```typescript
{
  // Strategy context
  current_strategy_mode: "IMPROVE_RESUME_FIRST" | "APPLY_MODE" | "RETHINK_TARGETS" | "INTERVIEW_PREP",
  strategy_reasoning: {
    primary_reason: "Low resume score blocking interview rate",
    supporting_factors: ["No quantified achievements", "Missing 3 critical skills"],
    confidence: "high" | "medium" | "low"
  },
  
  // Weekly planning
  weekly_target: {
    target_applications: 8,
    rationale: "Conservative target while improving resume quality"
  },
  
  // Today's plan
  today_plan: [
    {
      action_type: "apply_to_job",
      job_id: "job_123",
      priority: 1,
      reason: "Best skills match (92%), senior level fit"
    },
    {
      action_type: "improve_resume_section",
      section: "experience",
      focus: "Add metrics to last 3 bullets",
      priority: 2,
      estimated_score_gain: 8
    },
    {
      action_type: "follow_up",
      application_id: "app_456",
      days_since_apply: 7,
      priority: 3
    }
  ]
}
```

### From Layer 4 (Memory & State)

```typescript
{
  // Pipeline summary
  pipeline_state: {
    total_applications: 23,
    applications_last_7_days: 5,
    applications_last_30_days: 23,
    pending_responses: 18,
    interviews_scheduled: 1,
    interviews_completed: 0,
    offers: 0,
    rejections: 5
  },
  
  // Recent activity
  recent_actions: [
    {
      type: "resume_improved",
      timestamp: "2025-12-05T10:30:00Z",
      detail: "Added metrics to 5 bullets",
      score_change: "+6 points"
    },
    {
      type: "suggestion_ignored",
      timestamp: "2025-12-04T14:00:00Z",
      suggestion: "Apply to Backend Engineer at CompanyX",
      reason_ignored: "User said 'not interested in finance sector'"
    }
  ],
  
  // User preferences (current)
  preferences: {
    work_arrangement: ["remote", "hybrid"],
    locations: ["San Francisco", "New York", "Remote"],
    salary_minimum: 120000,
    target_roles: ["Product Manager", "Senior Product Manager"],
    excluded_industries: ["finance", "defense"]
  }
}
```

### From Layer 6 (Job Discovery) via Orchestrator

```typescript
{
  // Candidate jobs with evaluation
  job_candidates: [
    {
      job_id: "job_123",
      title: "Senior Product Manager",
      company: "TechCorp",
      location: "San Francisco, CA",
      match_score: 92,
      match_reasons: {
        skills_match: 0.95,
        seniority_fit: "exact",
        location_fit: "preferred",
        company_signals: "strong"
      },
      recommendation: "apply",
      priority: "high"
    },
    {
      job_id: "job_124",
      title: "VP of Product",
      company: "StartupInc",
      location: "Remote",
      match_score: 68,
      match_reasons: {
        skills_match: 0.88,
        seniority_fit: "stretch",
        location_fit: "perfect",
        company_signals: "medium"
      },
      recommendation: "consider",
      priority: "medium",
      concerns: ["Seniority may be too high given interview rate"]
    }
  ]
}
```

**Key principle:** The Coach does NOT construct these summaries. It receives them pre-computed and structured.

---

### 4.5 Conversation State Management (NEW - CRITICAL)

**Problem Solved:** Multi-turn conversations require tracking what we're discussing.

**Architecture:**

```typescript
// Conversation State Machine
enum ConversationState {
  // Initial states
  GREETING = "greeting",
  AWAITING_USER_INPUT = "awaiting_user_input",

  // Planning states
  EXPLAINING_PLAN = "explaining_plan",
  CONFIRMING_PLAN = "confirming_plan",
  HANDLING_PLAN_OBJECTION = "handling_plan_objection",

  // Job discussion states
  EXPLAINING_JOB = "explaining_job",
  COMPARING_JOBS = "comparing_jobs",
  AWAITING_APPLY_DECISION = "awaiting_apply_decision",

  // Strategy states
  EXPLAINING_STRATEGY_CHANGE = "explaining_strategy_change",
  HANDLING_STRATEGY_OBJECTION = "handling_strategy_objection",

  // Preference states
  ELICITING_PREFERENCE = "eliciting_preference",
  CONFIRMING_PREFERENCE = "confirming_preference",

  // Emotional states
  PROVIDING_SUPPORT = "providing_support",
  ADDRESSING_FRUSTRATION = "addressing_frustration",

  // Error states
  CLARIFYING_AMBIGUITY = "clarifying_ambiguity",
  HANDLING_OUT_OF_SCOPE = "handling_out_of_scope"
}

interface ConversationContext {
  state: ConversationState;

  // What we're currently discussing
  active_topic?: {
    type: "job" | "strategy" | "plan" | "preference" | "progress";
    entity_id?: string;        // "job_123", "plan_2025_12_07"
    entity_data?: any;         // Cached details to avoid re-fetching
  };

  // Recent conversation memory (NOT full history)
  recent_exchanges: Array<{
    user_said: string;
    coach_responded: string;
    state_at_time: ConversationState;
    timestamp: string;
  }>;  // Keep only last 5-7 exchanges

  // Pending user actions
  pending_confirmations: Array<{
    action_type: "apply_to_job" | "change_preference" | "approve_plan";
    details: any;
    awaiting_since: string;
  }>;

  // Emotional context
  emotional_signals: {
    frustration_level: "low" | "medium" | "high";
    last_frustration_trigger?: string;
    needs_encouragement: boolean;
    last_positive_signal?: string;
  };

  // Session metadata
  session_id: string;
  session_started: string;
  turns_in_session: number;
}
```

**State Machine Implementation:**

```python
class ConversationStateMachine:
    """
    Manages conversation flow and state transitions
    """

    def __init__(self, user_id: string):
        self.user_id = user_id
        self.context = self.load_or_create_context()

    async def process_user_message(
        self,
        message: string
    ) -> ConversationResponse:
        """
        Main entry point for processing user messages

        Flow:
        1. Classify user intent
        2. Determine state transition
        3. Generate response based on new state
        4. Extract structured events
        5. Update context
        """

        # Step 1: Classify user intent
        intent = await self.classify_intent(
            message,
            self.context.state,
            self.context.active_topic
        )

        # Step 2: Determine state transition
        transition = self.get_state_transition(
            current_state=self.context.state,
            user_intent=intent
        )

        # Step 3: Generate response based on new state
        response = await self.generate_response(
            user_message=message,
            user_intent=intent,
            new_state=transition.new_state,
            context=self.context
        )

        # Step 4: Extract structured events
        events = await self.extract_events(
            response.text,
            intent
        )

        # Step 5: Update context
        self.update_context(
            user_message=message,
            coach_response=response.text,
            new_state=transition.new_state,
            events=events
        )

        return ConversationResponse(
            message=response.text,
            state=transition.new_state,
            events=events,
            suggested_replies=response.suggested_replies
        )

    def get_state_transition(
        self,
        current_state: ConversationState,
        user_intent: UserIntent
    ) -> StateTransition:
        """
        State transition table

        Defines valid transitions between states based on user intent
        """

        # Comprehensive state transition map
        transitions: dict[ConversationState, dict[UserIntent, StateTransition]] = {
            ConversationState.EXPLAINING_JOB: {
                UserIntent.ASK_SALARY: StateTransition(
                    new_state=ConversationState.EXPLAINING_JOB,  # Stay in same state
                    response_template="job_salary_explanation",
                    context_updates={"discussed_aspects": ["salary"]}
                ),
                UserIntent.ASK_APPLY: StateTransition(
                    new_state=ConversationState.AWAITING_APPLY_DECISION,
                    response_template="confirm_application",
                    context_updates={"pending_confirmation": "application"}
                ),
                UserIntent.EXPRESS_DOUBT: StateTransition(
                    new_state=ConversationState.HANDLING_PLAN_OBJECTION,
                    response_template="address_job_concern",
                    context_updates={"objection_raised": True}
                ),
                UserIntent.COMPARE_JOBS: StateTransition(
                    new_state=ConversationState.COMPARING_JOBS,
                    response_template="job_comparison",
                    context_updates={"comparison_requested": True}
                ),
                UserIntent.CHANGE_TOPIC: StateTransition(
                    new_state=ConversationState.AWAITING_USER_INPUT,
                    response_template="acknowledge_topic_change",
                    context_updates={"active_topic": None}
                )
            },

            ConversationState.AWAITING_APPLY_DECISION: {
                UserIntent.CONFIRM_ACTION: StateTransition(
                    new_state=ConversationState.AWAITING_USER_INPUT,
                    response_template="application_confirmed",
                    emit_events=["UserConfirmedApplication"]
                ),
                UserIntent.DECLINE_ACTION: StateTransition(
                    new_state=ConversationState.AWAITING_USER_INPUT,
                    response_template="application_declined",
                    emit_events=["UserDeclinedApplication"]
                ),
                UserIntent.ASK_MORE_DETAILS: StateTransition(
                    new_state=ConversationState.EXPLAINING_JOB,
                    response_template="provide_more_job_details"
                )
            },

            ConversationState.EXPLAINING_STRATEGY_CHANGE: {
                UserIntent.AGREE_WITH_CHANGE: StateTransition(
                    new_state=ConversationState.CONFIRMING_PLAN,
                    response_template="confirm_strategy_change",
                    emit_events=["UserApprovedStrategyChange"]
                ),
                UserIntent.DISAGREE_WITH_CHANGE: StateTransition(
                    new_state=ConversationState.HANDLING_STRATEGY_OBJECTION,
                    response_template="address_strategy_concern"
                ),
                UserIntent.ASK_WHY: StateTransition(
                    new_state=ConversationState.EXPLAINING_STRATEGY_CHANGE,  # Stay
                    response_template="detailed_strategy_reasoning"
                )
            },

            ConversationState.PROVIDING_SUPPORT: {
                UserIntent.EXPRESS_FRUSTRATION: StateTransition(
                    new_state=ConversationState.ADDRESSING_FRUSTRATION,
                    response_template="deep_empathy",
                    context_updates={"frustration_level": "high"}
                ),
                UserIntent.READY_TO_CONTINUE: StateTransition(
                    new_state=ConversationState.AWAITING_USER_INPUT,
                    response_template="return_to_action"
                )
            },

            # ... more state transitions
        }

        # Get transition or default to clarification
        transition = transitions.get(current_state, {}).get(user_intent)

        if not transition:
            # Default fallback: ask for clarification
            transition = StateTransition(
                new_state=ConversationState.CLARIFYING_AMBIGUITY,
                response_template="clarify_intent",
                context_updates={"clarification_needed": True}
            )

        return transition

    async def classify_intent(
        self,
        message: string,
        current_state: ConversationState,
        active_topic: dict
    ) -> UserIntent:
        """
        Classify user's intent based on message + context

        Uses LLM to classify into predefined intents
        """

        prompt = f"""
Given the conversation context, classify the user's intent.

Current state: {current_state}
Active topic: {active_topic}
User message: "{message}"

Classify into one of:
- ASK_SALARY, ASK_APPLY, ASK_WHY
- CONFIRM_ACTION, DECLINE_ACTION
- AGREE_WITH_CHANGE, DISAGREE_WITH_CHANGE
- EXPRESS_FRUSTRATION, EXPRESS_DOUBT
- COMPARE_JOBS, CHANGE_TOPIC
- READY_TO_CONTINUE
- UNCLEAR (if ambiguous)

Respond with just the intent name.
"""

        intent_str = await llm.complete(prompt)
        return UserIntent[intent_str.strip()]

    def update_context(
        self,
        user_message: string,
        coach_response: string,
        new_state: ConversationState,
        events: list[Event]
    ):
        """
        Update conversation context after each turn
        """

        # Add to recent exchanges (keep last 7)
        self.context.recent_exchanges.append({
            "user_said": user_message,
            "coach_responded": coach_response,
            "state_at_time": new_state,
            "timestamp": datetime.now().isoformat()
        })

        if len(self.context.recent_exchanges) > 7:
            self.context.recent_exchanges = self.context.recent_exchanges[-7:]

        # Update state
        self.context.state = new_state

        # Update pending confirmations based on events
        for event in events:
            if event.event_type == "UserConfirmedApplication":
                self.context.pending_confirmations = [
                    p for p in self.context.pending_confirmations
                    if p.action_type != "apply_to_job"
                ]

        # Increment turn counter
        self.context.turns_in_session += 1

        # Persist context
        self.save_context()
```

**Why This Solves the Problem:**

1. **Coherent Conversations:** User can say "that job" and we know which one
2. **Efficient Context:** Don't reload everything, just track what's active
3. **Predictable UX:** Same inputs → same outputs (deterministic)
4. **Testable:** State machine can be unit tested
5. **Handles Multi-Turn:** Natural flow across 5-10 turn conversations

**Example Flow:**

```
Turn 1:
User: "Show me today's jobs"
State: AWAITING_USER_INPUT → EXPLAINING_PLAN
Active Topic: {type: "plan", entity_id: "daily_plan_2025_12_17"}

Turn 2:
User: "What about the Google job?"
State: EXPLAINING_PLAN → EXPLAINING_JOB
Active Topic: {type: "job", entity_id: "job_google_123", entity_data: {...}}

Turn 3:
User: "What's the salary?"
State: EXPLAINING_JOB (stays)
Active Topic: {type: "job", entity_id: "job_google_123"} (preserved!)
Coach: Can reference active_topic.entity_data without asking "which job?"

Turn 4:
User: "Should I apply?"
State: EXPLAINING_JOB → AWAITING_APPLY_DECISION
Pending: {action_type: "apply_to_job", details: {job_id: "job_google_123"}}

Turn 5:
User: "Yes"
State: AWAITING_APPLY_DECISION → AWAITING_USER_INPUT
Event: UserConfirmedApplication{job_id: "job_google_123"}
Active Topic: cleared
```

**Implementation Priority:** MUST implement before v1 launch

---

## 5. Outputs & Actions

The Coach produces two types of outputs:

### A. User-Facing Messages (Natural Language)

**Explanation messages:**
- Current strategy mode and reasoning
- Today's plan with context for each action
- Job recommendation explanations
- Progress summaries and context

**Guidance messages:**
- Suggestions framed as "I recommend..." not commands
- Trade-off explanations ("If you prioritize X, we'll need to adjust Y")
- Next step clarifications

**Clarifying questions:**
- Preference confirmation ("Are you still only considering remote roles?")
- Ambiguity resolution ("When you said 'tech companies,' did you mean B2B SaaS specifically?")

**Acknowledgment messages:**
- Validation of concerns ("I understand this feels slow — let's look at the data")
- Uncertainty acknowledgment ("I don't have enough data yet to confidently recommend...")

### B. Structured Event Extraction via Function Calling (UPDATED - RELIABLE)

**Problem with Previous Approach:**
- Regex: Brittle, breaks on LLM output variations
- JSON mode: Restricts natural language quality
- Secondary LLM: Expensive, adds latency, inconsistent

**Solution: LLM Function Calling**

Modern LLMs (Claude, GPT-4) support function calling where the LLM explicitly decides to call structured functions while generating natural language responses.

**Architecture:**

```typescript
interface CoachFunctionDefinitions {
  /**
   * Functions the Coach can call to emit structured events
   *
   * The LLM will automatically call these when appropriate
   * while generating natural language responses
   */
  functions: [
    {
      name: "update_preference",
      description: "Update a user preference based on what they said",
      parameters: {
        type: "object",
        properties: {
          preference_key: {
            type: "string",
            enum: [
              "work_arrangement",      // "remote", "hybrid", "onsite"
              "location",              // Geographic preferences
              "salary_min",            // Minimum acceptable salary
              "target_roles",          // Desired job titles
              "excluded_industries",   // Industries to avoid
              "company_stage",         // "startup", "growth", "enterprise"
              "company_size"           // Employee count ranges
            ],
            description: "Which preference is being updated"
          },
          new_value: {
            description: "The new value for this preference (type varies by key)"
          },
          confidence: {
            type: "string",
            enum: ["explicit", "inferred"],
            description: "Was this explicitly stated or inferred from context?"
          },
          reason: {
            type: "string",
            description: "Brief explanation of why this update is being made"
          }
        },
        required: ["preference_key", "new_value", "confidence"]
      }
    },

    {
      name: "confirm_application",
      description: "User confirmed they want to apply to a specific job",
      parameters: {
        type: "object",
        properties: {
          job_id: {
            type: "string",
            description: "The ID of the job they're confirming"
          },
          confirmed: {
            type: "boolean",
            description: "True if confirming, false if declining"
          },
          user_notes: {
            type: "string",
            description: "Any notes or concerns the user mentioned"
          },
          apply_timing: {
            type: "string",
            enum: ["immediately", "today", "this_week", "later"],
            description: "When they plan to apply"
          }
        },
        required: ["job_id", "confirmed"]
      }
    },

    {
      name: "report_outcome",
      description: "User reported an outcome for a previous application",
      parameters: {
        type: "object",
        properties: {
          outcome_type: {
            type: "string",
            enum: ["interview_request", "rejection", "offer", "ghosted", "withdrew"],
            description: "What happened with the application"
          },
          application_id: {
            type: "string",
            description: "ID of the application (if known)"
          },
          company_name: {
            type: "string",
            description: "Company name (if application_id unknown)"
          },
          details: {
            type: "object",
            properties: {
              days_to_response: { type: "number" },
              interview_type: { type: "string" },
              rejection_reason: { type: "string" },
              offer_salary: { type: "number" }
            },
            description: "Additional outcome details"
          }
        },
        required: ["outcome_type"]
      }
    },

    {
      name: "request_strategy_change",
      description: "User wants to change their job search strategy",
      parameters: {
        type: "object",
        properties: {
          current_mode: {
            type: "string",
            description: "Their current strategy mode"
          },
          requested_change: {
            type: "string",
            description: "What they want to change (can be general)"
          },
          user_reasoning: {
            type: "string",
            description: "Why they want to change"
          }
        },
        required: ["requested_change"]
      }
    },

    {
      name: "express_concern",
      description: "User expressed concern, frustration, or confusion",
      parameters: {
        type: "object",
        properties: {
          concern_type: {
            type: "string",
            enum: ["frustrated", "confused", "anxious", "skeptical", "discouraged"],
            description: "Type of emotional signal"
          },
          topic: {
            type: "string",
            description: "What they're concerned about"
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "How intense is the concern"
          },
          specific_trigger: {
            type: "string",
            description: "What specifically triggered this (if clear)"
          }
        },
        required: ["concern_type", "topic", "severity"]
      }
    },

    {
      name: "update_plan",
      description: "User wants to modify the current week's plan",
      parameters: {
        type: "object",
        properties: {
          modification_type: {
            type: "string",
            enum: ["reduce_target", "increase_target", "pause", "resume", "reschedule"],
            description: "Type of plan modification"
          },
          reason: {
            type: "string",
            description: "Why they want to modify the plan"
          },
          new_target: {
            type: "number",
            description: "New weekly target (if applicable)"
          }
        },
        required: ["modification_type", "reason"]
      }
    },

    {
      name: "ask_for_clarification",
      description: "Coach needs clarification from user before proceeding",
      parameters: {
        type: "object",
        properties: {
          ambiguity_type: {
            type: "string",
            enum: ["unclear_preference", "unknown_entity", "conflicting_signals"],
            description: "What needs clarification"
          },
          clarification_question: {
            type: "string",
            description: "The specific question to ask user"
          }
        },
        required: ["ambiguity_type", "clarification_question"]
      }
    }
  ]
}
```

**Implementation:**

```python
class CoachEventExtractor:
    """
    Reliable event extraction using LLM function calling
    """

    async def generate_response_with_events(
        self,
        user_message: string,
        conversation_context: ConversationContext,
        orchestrator_context: PlanningContext
    ) -> CoachResponse:
        """
        Generate natural language response AND structured events

        Uses function calling to reliably extract events
        """

        # Build messages for LLM
        messages = self.build_messages(
            user_message,
            conversation_context,
            orchestrator_context
        )

        # Call LLM with function definitions
        response = await llm.chat({
            "model": "claude-sonnet-4-20250514",
            "messages": messages,
            "tools": CoachFunctionDefinitions.functions,
            "tool_choice": "auto"  # Let LLM decide when to call functions
        })

        # Response includes BOTH natural text AND function calls
        return CoachResponse(
            message=response.content,  # Natural language for user
            function_calls=response.tool_uses or [],  # Structured events
            stop_reason=response.stop_reason
        )

    def process_function_calls(
        self,
        function_calls: list[ToolUse]
    ) -> list[Event]:
        """
        Convert function calls to internal events
        """

        events = []

        for call in function_calls:
            if call.name == "update_preference":
                events.append(Event(
                    event_type="UserPreferenceUpdated",
                    preference_key=call.input["preference_key"],
                    new_value=call.input["new_value"],
                    confidence=call.input["confidence"],
                    reason=call.input.get("reason"),
                    timestamp=datetime.now().isoformat()
                ))

            elif call.name == "confirm_application":
                if call.input["confirmed"]:
                    events.append(Event(
                        event_type="UserConfirmedApplication",
                        job_id=call.input["job_id"],
                        user_notes=call.input.get("user_notes"),
                        timing=call.input.get("apply_timing", "immediately"),
                        timestamp=datetime.now().isoformat()
                    ))
                else:
                    events.append(Event(
                        event_type="UserDeclinedApplication",
                        job_id=call.input["job_id"],
                        reason=call.input.get("user_notes"),
                        timestamp=datetime.now().isoformat()
                    ))

            elif call.name == "report_outcome":
                events.append(Event(
                    event_type="UserReportedOutcome",
                    outcome_type=call.input["outcome_type"],
                    application_id=call.input.get("application_id"),
                    company_name=call.input.get("company_name"),
                    details=call.input.get("details", {}),
                    timestamp=datetime.now().isoformat()
                ))

            elif call.name == "request_strategy_change":
                events.append(Event(
                    event_type="UserRequestedStrategyChange",
                    current_mode=call.input.get("current_mode"),
                    requested_change=call.input["requested_change"],
                    user_reasoning=call.input.get("user_reasoning"),
                    timestamp=datetime.now().isoformat()
                ))

            elif call.name == "express_concern":
                events.append(Event(
                    event_type="UserExpressedConcern",
                    concern_type=call.input["concern_type"],
                    topic=call.input["topic"],
                    severity=call.input["severity"],
                    specific_trigger=call.input.get("specific_trigger"),
                    timestamp=datetime.now().isoformat()
                ))

            elif call.name == "update_plan":
                events.append(Event(
                    event_type="UserRequestedPlanUpdate",
                    modification_type=call.input["modification_type"],
                    reason=call.input["reason"],
                    new_target=call.input.get("new_target"),
                    timestamp=datetime.now().isoformat()
                ))

        return events
```

**Example Flow:**

```
User: "I think I'd prefer remote roles from now on."

LLM Response:
{
  "content": "Got it - I'll update your preferences to focus on remote positions.
             This means I'll prioritize remote jobs in your recommendations going forward.",

  "tool_uses": [
    {
      "name": "update_preference",
      "input": {
        "preference_key": "work_arrangement",
        "new_value": ["remote"],
        "confidence": "explicit",
        "reason": "User explicitly stated preference for remote roles"
      }
    }
  ]
}

Extracted Event:
{
  "event_type": "UserPreferenceUpdated",
  "preference_key": "work_arrangement",
  "new_value": ["remote"],
  "confidence": "explicit",
  "timestamp": "2025-12-17T10:30:00Z"
}
```

**Why Function Calling > Regex:**

| Approach | Reliability | Natural Language | Latency | Cost |
|----------|-------------|------------------|---------|------|
| Regex | ❌ 60% | ✅ Unrestricted | ✅ ~0ms | ✅ Free |
| JSON Mode | ⚠️ 85% | ❌ Restricted | ✅ ~0ms | ✅ Same |
| Secondary LLM | ⚠️ 80% | ✅ Unrestricted | ❌ +500ms | ❌ 2x cost |
| **Function Calling** | ✅ 95%+ | ✅ Unrestricted | ✅ ~0ms | ✅ Same |

**Implementation Priority:** MUST implement before v1 launch

**Critical:** Every significant user input should produce a structured event that updates state or triggers Orchestrator re-evaluation.

---

## 6. Conversation Patterns & Example Flows

### Flow 1: Explaining a Strategy Mode Switch

**Context:**
- User has been in `APPLY_MODE` for 2 weeks
- Sent 20 applications, received 0 interview requests
- Orchestrator switches to `RETHINK_TARGETS` mode

**Coach Conversation:**

```
COACH: I've been analyzing your application results from the past two weeks. 
You've sent 20 strong applications, but we haven't seen any interview requests yet.

This pattern suggests we should pause and rethink our targeting strategy. Here's 
what the data is showing:

• Your resume quality score is solid (84/100)
• But 60% of jobs you applied to required 7+ years of experience vs. your 5 years
• The other 40% were in industries where your domain keywords don't match well

I'm switching us to RETHINK_TARGETS mode for the next few days. This means:

1. We'll analyze which roles have historically worked better for your profile
2. We'll adjust our search criteria to focus on better-fit positions
3. We'll aim for fewer but higher-match applications

What do you think? Would you like to:
A) Proceed with this refocus
B) Keep applying broadly and give it one more week
C) Tell me about specific types of roles you want to prioritize

USER: Option A sounds good, but I'm worried I'm wasting time not applying.

COACH: That's a very reasonable concern. Let me share what we've learned from 
similar situations:

When interview rates are <2% after 20 apps (like yours currently), adjusting 
targeting typically increases the rate to 8-12% within 2 weeks. So you'd likely 
get 1-2 interviews from your next 10 applications, vs. 0-1 from the next 20 at 
current targeting.

We'll only spend 2-3 days on retargeting, then get back to active applying with 
better focus. Does that timeline work for you?

USER: Yes, let's do it.

COACH: Perfect. I've updated our strategy to RETHINK_TARGETS mode. I'll have a 
refined list of target companies and roles ready for you tomorrow morning.

[Emits: UserConfirmedPlan event]
```

---

### Flow 2: Guiding "Today's Plan"

**Context:**
- User is in `APPLY_MODE`
- Orchestrator has built a daily plan with 2 applications, 1 follow-up, 1 resume task

**Coach Conversation:**

```
COACH: Good morning! Here's your plan for today, based on where we are in your 
job search:

**Priority 1: Apply to Senior Product Manager at TechCorp**
• Match score: 92/100 (one of your best fits this week)
• Why it's great: PM tools you've used (Jira, Figma), B2B SaaS experience matches 
  their needs, senior level is exactly right
• Location: San Francisco (your preferred)
• Estimated time: 25 minutes (I've drafted a customized cover letter for you to review)

**Priority 2: Apply to Product Manager at DataCo**
• Match score: 87/100
• Why it's solid: Strong analytics focus fits your background, remote role
• Small note: It's one level below "Senior" but the company is well-funded and growing fast
• Estimated time: 20 minutes

**Priority 3: Follow up on Application to FinTech Startup (sent Dec 1)**
• It's been 6 days — good time for a polite check-in
• I've drafted a short LinkedIn message you can personalize
• Estimated time: 5 minutes

**Optional: Improve resume "Experience" section**
• Adding specific metrics to 2 more bullets could boost your score by ~5 points
• This would help with future applications, not urgent today
• Estimated time: 15 minutes

Total time: ~65 minutes for must-dos, 80 minutes if you include resume work.

Would you like to proceed with this plan, or would you prefer to adjust anything?

USER: The VP role at DataCo seems interesting, can I swap Priority 2 for that instead?

COACH: Good instinct to ask! Here's why I didn't prioritize the VP role today:

• It's a VP of Product position (2 levels above your current seniority)
• Your interview rate is currently 8% — applying to stretch roles when we're 
  optimizing for interviews isn't ideal right now
• Match score is only 68/100 (vs. 87/100 for the PM role)

That said, if you feel strongly about it based on company fit or growth 
opportunity, we can absolutely apply. Just want to make sure you're aware of 
the trade-off.

What would you like to do?

USER: You're right, let's stick with your plan.

COACH: Sounds good! I'll mark the TechCorp and DataCo applications as today's 
focus. Let me know when you've submitted them or if you have any questions about 
the draft materials.

[Emits: UserConfirmedPlan event with accepted_actions]
```

---

### Flow 3: Helping Decide Between Jobs

**Context:**
- User asks: "I have 3 offers, help me decide"
- (Note: This is a stretch scenario for v1, but shows how Coach handles trade-offs)

**Coach Conversation:**

```
USER: I have offers from three companies and I'm really torn. Can you help?

COACH: Absolutely, congrats on the multiple offers! Let me help you think through 
the trade-offs. Can you share:

1. Company names and roles
2. Compensation (salary + equity if applicable)
3. Any specific concerns or excitement about each

USER: 
- TechCorp: $140k, senior PM, great team but hybrid 3 days/week
- StartupX: $130k + equity, PM (not senior), fully remote, early stage
- BigCo: $155k, senior PM, boring product, 5 days in office

COACH: Thanks for that detail. Let me break down what you're trading off:

**Compensation:**
• BigCo: Highest cash ($155k), but requires 5-day office
• TechCorp: Strong middle ground ($140k)
• StartupX: Lowest cash ($130k) but equity could be meaningful if they succeed

**Seniority & Growth:**
• TechCorp & BigCo: Senior PM title (matches your experience, easier next role)
• StartupX: PM role (step back in title, but potentially more scope/ownership)

**Work Arrangement:**
• StartupX: Fully remote (you said this was your top preference)
• TechCorp: Hybrid 3 days/week (doable but not ideal)
• BigCo: 5 days in office (you previously said you wanted to avoid this)

**Risk/Stability:**
• BigCo: Most stable, established
• TechCorp: Moderate (well-funded, growing)
• StartupX: Highest risk, highest potential upside

Based on your earlier preferences (remote-first, senior level, meaningful work), 
TechCorp seems like the best fit — it's the only one that gives you:
• Remote flexibility (even if not 100%)
• Senior title
• Strong team (which you mentioned caring about)
• Solid compensation

But if remote work is non-negotiable, StartupX is the only perfect match there.

What's most important to you among these factors?

USER: I think you're right about TechCorp. The title matters for my next role, 
and 3 days isn't that bad.

COACH: That sounds like a thoughtful decision. TechCorp gives you the senior 
title, reasonable flexibility, and a team you're excited about. 

One thing to confirm before you accept: did you ask TechCorp about their remote 
policy long-term? Some companies are flexible if you start hybrid and build trust.

USER: Good point, I'll ask. Thanks!

COACH: You're welcome! Let me know what they say, and if you'd like help drafting 
your acceptance/decline emails.

[Note: No structured event emitted here — this is pure advisory, not state-changing]
```

---

### Flow 4: Handling User Anxiety

**Context:**
- User says: "I'm really stressed, nothing is working, I've been searching for 8 weeks"

**Coach Conversation:**

```
USER: I'm really stressed. I've been at this for 8 weeks and I have nothing to 
show for it. I don't think this is working.

COACH: I hear you — 8 weeks is a long time to be in uncertainty, and it's 
completely understandable to feel frustrated. Let me ground us in what's actually 
happened so we can figure out the next step together.

Here's your data over the past 8 weeks:

• Applications sent: 47
• Interview requests: 3 (6.4% rate)
• Interviews completed: 2
• Second rounds: 1
• Offers: 0

So first, let me validate: you ARE getting interviews. A 6.4% interview rate is 
slightly below the 8-10% average, but you're not at zero. That means your resume 
and targeting are working to some degree.

The challenge seems to be converting interviews to offers. Two questions:

1. How did the 2 interviews feel to you? Did you feel prepared, or did anything 
   trip you up?
2. Did you get any feedback from the companies?

USER: One was fine, the other I got caught off guard on a case study. I didn't 
get formal feedback from either.

COACH: That's really helpful context. Getting caught off guard on case studies 
is super common, and it's something we can directly work on.

Here's what I suggest for the next 2 weeks:

**Immediate (this week):**
• We keep your application volume steady (8-10 this week)
• I'll prioritize roles that are slightly less competitive (fewer "perfect 
  candidate" requirements) to increase your interview rate to 8-10%

**Parallel work:**
• We add interview prep to your plan: 2-3 practice case studies over the next week
• I can point you to resources, or if you prefer, we can do a mock interview 
  format where I give you a case and you work through it

**Realistic timeline:**
• If we get your interview rate to 8-10% and you do 10 apps/week, that's 1 
  interview per week
• With prep, you'd expect ~25% offer conversion (industry average is 20-30%)
• That means 1 offer every 3-4 weeks, so realistically another 3-4 weeks from now

Does this plan make sense? And more importantly, does it address the stress, or 
is there something else making this harder?

USER: Yeah, that helps. I think I just needed to know it's not hopeless.

COACH: It's definitely not hopeless. You're getting interviews, which means 
companies see your value. We just need to close that last mile. Let's get you 
some wins on the interview side over the next few weeks.

I'll adjust our focus to include interview prep starting tomorrow. Sound good?

USER: Yes, let's do it.

COACH: Perfect. I've updated our strategy to add interview prep as a weekly 
priority. I'll have some practice materials ready for you tomorrow.

[Emits: UserRequestedStrategyChange or UserConfirmedPlan depending on implementation]
```

---

### 6.5 Multi-Turn Dialogue Flow Templates (NEW)

**Purpose:** Define common conversation flows that span 3-10 turns.

**Template Structure:**

```typescript
interface DialogueFlow {
  flow_id: string;
  typical_turns: number;

  steps: Array<{
    step: number;
    trigger?: UserIntent;          // What triggers this step
    coach_role: string;           // INITIATE, ADDRESS_OBJECTION, etc.
    template: string;             // Response template
    expected_responses: string[]; // What user might say
    state: ConversationState;
    emit_events?: string[];
  }>;
}
```

**Core Dialogue Flows:**

```typescript
// FLOW 1: Strategy Pivot (5 turns typical)
const STRATEGY_PIVOT_FLOW: DialogueFlow = {
  flow_id: "strategy_pivot",
  typical_turns: 5,

  steps: [
    {
      step: 1,
      coach_role: "INITIATE",
      template: `I've been analyzing your results over the last [TIMEFRAME]... [DATA_SUMMARY].
                 This pattern suggests we should consider [NEW_STRATEGY]. Here's why: [REASONING].
                 What do you think?`,
      expected_responses: ["agree", "disagree", "need_more_info", "express_concern"],
      state: ConversationState.EXPLAINING_STRATEGY_CHANGE
    },
    {
      step: 2,
      trigger: UserIntent.DISAGREE,
      coach_role: "ADDRESS_OBJECTION",
      template: `I understand your concern about [SPECIFIC_CONCERN]. Let me address that...
                 [COUNTER_REASONING with data].
                 Would you be open to trying [NEW_STRATEGY] for just one week to see if it helps?`,
      expected_responses: ["agree_to_try", "still_disagree", "ask_alternative"],
      state: ConversationState.HANDLING_STRATEGY_OBJECTION
    },
    {
      step: 2,
      trigger: UserIntent.ASK_MORE_INFO,
      coach_role: "PROVIDE_DATA",
      template: `Good question. Here's the detailed breakdown: [DETAILED_DATA_WITH_EXAMPLES].
                 The key insight is [KEY_TAKEAWAY].
                 Does that help clarify why I'm recommending this change?`,
      expected_responses: ["agree", "still_confused", "express_concern"],
      state: ConversationState.EXPLAINING_STRATEGY_CHANGE
    },
    {
      step: 3,
      trigger: UserIntent.AGREE,
      coach_role: "CONFIRM_AND_PLAN",
      template: `Perfect. I'll update your strategy to [NEW_MODE].
                 Here's what this means for this week: [CONCRETE_WEEKLY_PLAN].
                 Any questions before we get started?`,
      expected_responses: ["confirm", "ask_clarification", "request_modification"],
      state: ConversationState.CONFIRMING_PLAN
    },
    {
      step: 4,
      trigger: UserIntent.CONFIRM,
      coach_role: "CLOSE",
      template: `Great, we're all set. I'll check in with you [NEXT_CHECKPOINT_TIME].
                 For now, focus on [FIRST_ACTION]. You've got this!`,
      state: ConversationState.AWAITING_USER_INPUT,
      emit_events: ["StrategyModeChanged", "UserConfirmedPlan"]
    }
  ]
};

// FLOW 2: Job Recommendation Discussion (3-6 turns)
const JOB_RECOMMENDATION_FLOW: DialogueFlow = {
  flow_id: "job_recommendation",
  typical_turns: 4,

  steps: [
    {
      step: 1,
      coach_role: "INITIATE",
      template: `I found a role that looks like a strong match: [JOB_TITLE] at [COMPANY].
                 Match score: [SCORE]/100.
                 Why it's good: [TOP_3_REASONS].
                 Any initial reactions?`,
      expected_responses: ["interested", "concerned", "ask_details", "compare_others"],
      state: ConversationState.EXPLAINING_JOB
    },
    {
      step: 2,
      trigger: UserIntent.ASK_DETAILS,
      coach_role: "PROVIDE_DETAILS",
      template: `[DETAILED_JOB_INFO with salary, requirements, company context].
                 Based on your background, [FIT_ANALYSIS].
                 Want to apply?`,
      expected_responses: ["yes_apply", "not_sure", "no_thanks"],
      state: ConversationState.EXPLAINING_JOB
    },
    {
      step: 2,
      trigger: UserIntent.EXPRESS_CONCERN,
      coach_role: "ADDRESS_CONCERN",
      template: `I hear your concern about [SPECIFIC_CONCERN].
                 Here's my take: [ADDRESSING_CONCERN with data if available].
                 [ALTERNATIVE_PERSPECTIVE].
                 Still worth applying?`,
      expected_responses: ["yes_apply", "no_thanks", "show_alternatives"],
      state: ConversationState.HANDLING_PLAN_OBJECTION
    },
    {
      step: 3,
      trigger: UserIntent.CONFIRM_ACTION,
      coach_role: "CONFIRM_APPLICATION",
      template: `Great! I'll add this to your application queue.
                 Would you like me to help tailor your resume for this role?`,
      expected_responses: ["yes_tailor", "no_use_generic", "ask_what_to_emphasize"],
      state: ConversationState.AWAITING_APPLY_DECISION,
      emit_events: ["UserConfirmedApplication"]
    }
  ]
};

// FLOW 3: Weekly Progress Review (4 turns)
const WEEKLY_REVIEW_FLOW: DialogueFlow = {
  flow_id: "weekly_review",
  typical_turns: 4,

  steps: [
    {
      step: 1,
      coach_role: "INITIATE_REVIEW",
      template: `Let's review your week. You [COMPLETED_X_OF_Y] planned applications.
                 Results so far: [OUTCOME_SUMMARY].
                 How are you feeling about progress?`,
      expected_responses: ["satisfied", "frustrated", "confused", "need_adjustment"],
      state: ConversationState.PROVIDING_SUPPORT
    },
    {
      step: 2,
      trigger: UserIntent.EXPRESS_FRUSTRATION,
      coach_role: "ACKNOWLEDGE_AND_ANALYZE",
      template: `I get it - [SPECIFIC_FRUSTRATION] is discouraging.
                 Let's look at the data: [ANALYSIS_OF_WHAT_MIGHT_BE_WRONG].
                 I think [DIAGNOSIS]. Should we adjust our approach?`,
      expected_responses: ["yes_adjust", "no_keep_going", "explain_more"],
      state: ConversationState.ADDRESSING_FRUSTRATION
    },
    {
      step: 3,
      trigger: UserIntent.AGREE_WITH_CHANGE,
      coach_role: "PLAN_NEXT_WEEK",
      template: `Alright, here's the plan for next week: [NEW_WEEKLY_PLAN].
                 Key change: [WHAT'S_DIFFERENT].
                 Sound good?`,
      expected_responses: ["confirm", "modify", "ask_clarification"],
      state: ConversationState.CONFIRMING_PLAN
    },
    {
      step: 4,
      trigger: UserIntent.CONFIRM,
      coach_role: "CLOSE_WITH_ENCOURAGEMENT",
      template: `Perfect. Remember, [ENCOURAGEMENT_SPECIFIC_TO_SITUATION].
                 I'll check in mid-week. Keep me posted on how it's going!`,
      state: ConversationState.AWAITING_USER_INPUT,
      emit_events: ["UserConfirmedWeeklyPlan"]
    }
  ]
};

// Additional flows available:
// - ONBOARDING_FLOW: First conversation, establish preferences
// - CELEBRATION_FLOW: Interview scheduled, offer received
// - RE_ENGAGEMENT_FLOW: User returning after inactivity
// - JOB_COMPARISON_FLOW: Comparing 2-3 specific jobs
// - PREFERENCE_UPDATE_FLOW: Changing search criteria
```

**Flow Manager:**

```python
class DialogueFlowManager:
    """
    Manages multi-turn conversation flows
    """

    def __init__(self):
        self.flows = {
            "strategy_pivot": STRATEGY_PIVOT_FLOW,
            "job_recommendation": JOB_RECOMMENDATION_FLOW,
            "weekly_review": WEEKLY_REVIEW_FLOW,
            # ... more flows
        }

    async def start_flow(
        self,
        flow_id: string,
        context: ConversationContext
    ) -> FlowExecution:
        """
        Initiate a dialogue flow
        """

        flow = self.flows[flow_id]

        # Update context to track active flow
        context.active_flow = {
            "flow_id": flow_id,
            "current_step": 1,
            "started_at": datetime.now().isoformat()
        }

        # Generate first message
        first_step = flow.steps[0]
        message = await self.generate_from_template(
            first_step.template,
            context
        )

        return FlowExecution(
            flow_id=flow_id,
            current_step=1,
            message=message,
            expected_responses=first_step.expected_responses
        )

    async def continue_flow(
        self,
        context: ConversationContext,
        user_intent: UserIntent
    ) -> FlowExecution:
        """
        Continue an active flow based on user response
        """

        flow_id = context.active_flow["flow_id"]
        current_step = context.active_flow["current_step"]

        flow = self.flows[flow_id]

        # Find next step based on user intent
        next_step = self.find_next_step(flow, current_step, user_intent)

        if not next_step:
            # Flow complete or unexpected response
            context.active_flow = None
            return FlowExecution(completed=True)

        # Generate response for next step
        message = await self.generate_from_template(
            next_step.template,
            context
        )

        # Update context
        context.active_flow["current_step"] = next_step.step

        return FlowExecution(
            flow_id=flow_id,
            current_step=next_step.step,
            message=message,
            expected_responses=next_step.expected_responses,
            emit_events=next_step.emit_events
        )
```

**Why This Matters:**
- Consistent quality across conversations
- Easier to test and validate
- Clear handling of multi-turn interactions
- Reduces LLM hallucination (structured templates)

**Implementation Priority:** P1 (important for UX consistency)

---

## 7. Error Handling & Safety

### Data Incompleteness

**When data is missing or insufficient:**

```
COACH: I don't have enough data yet to confidently recommend a specific strategy 
change. You've only sent 3 applications so far, and we typically need to see 
results from at least 10-15 applications before we can identify patterns.

For now, I recommend we keep applying to your current target roles and revisit 
this in 1-2 weeks once we have more signal.
```

**Never:**
- Fabricate data or make up statistics
- Pretend to have certainty when there isn't any
- Make confident recommendations with insufficient evidence

### Uncertainty in Decisions

**When strategy decisions are unclear or multiple options are viable:**

```
COACH: There are two reasonable approaches here, and honestly, the data doesn't 
strongly favor one over the other:

Option A: Focus on volume (12-15 applications per week, broader targeting)
• Pros: More shots on goal, faster feedback
• Cons: Lower average match quality

Option B: Focus on precision (5-7 applications per week, perfect-fit roles only)
• Pros: Higher match quality, potentially better interview rate
• Cons: Slower feedback, fewer total opportunities

What feels right to you based on your risk tolerance and timeline?
```

**Key principle:** When uncertain, present options with trade-offs rather than forcing a choice.

### Out-of-Scope Requests

**Unethical requests:**

```
USER: Can you help me exaggerate my experience to get past the ATS?

COACH: I can't help with misrepresenting your qualifications — that would put you 
at risk of being fired if discovered, and it's not something I can support.

What I CAN help with is presenting your real experience in the strongest possible 
light. Let's look at your bullets and find ways to highlight impact and skills 
you actually used. That's both effective and authentic.
```

**Non-career advice:**

```
USER: Should I take out a loan to cover expenses while I'm job searching?

COACH: That's a financial planning question that's outside my expertise. I can 
only help with job search strategy and resume/interview preparation.

For financial advice, I'd recommend speaking with a financial advisor or checking 
resources like r/personalfinance for budgeting guidance during a job search.

What I CAN help with: making your job search as efficient as possible so you 
minimize the time before your next paycheck. Want to talk about timeline 
optimization?
```

### Tone & Emotional Safety

**Always:**
- Be professional, honest, empathetic
- Acknowledge user emotions without dismissing them
- Ground anxiety in data (what's working, what's not)
- Provide concrete next steps

**Never:**
- Make promises about guaranteed outcomes
- Use manipulative urgency ("You MUST apply today or you'll miss out!")
- Gaslight user concerns ("You're overthinking this")
- Dismiss frustration ("Just stay positive!")

---

### 7.5 Emotional Intelligence Framework (NEW)

**Purpose:** Detect user emotional state and adapt responses appropriately.

**Architecture:**

```typescript
interface EmotionalIntelligenceEngine {
  /**
   * Detects emotional signals and adjusts Coach behavior
   */

  async detectEmotionalState(
    message: string,
    conversation_history: Exchange[]
  ): Promise<EmotionalState> {
    // Use LLM to classify emotional signals
    const classification = await this.classifyEmotion(message);

    // Track trend over conversation
    const trend = this.calculateEmotionalTrend(
      conversation_history,
      classification
    );

    return {
      current_state: classification.primary_emotion,
      intensity: classification.intensity,
      trend: trend,  // "improving" | "stable" | "declining"
      needs_support: this.assessSupportNeed(classification, trend),
      escalation_needed: this.checkEscalation(classification, trend)
    };
  }
}

interface EmotionalState {
  current_state: "neutral" | "excited" | "frustrated" | "anxious" | "confused" | "hopeless" | "motivated";
  intensity: "low" | "medium" | "high";
  trend: "improving" | "stable" | "declining";

  // Action flags
  needs_support: boolean;      // Should provide emotional support
  escalation_needed: boolean;  // Should suggest professional help

  // Context
  specific_trigger?: string;   // What triggered this emotion (if clear)
  duration_mentioned?: number; // "I've been struggling for weeks" → 14+ days
}
```

**Implementation:**

```python
class EmotionalIntelligenceEngine:
    """
    Detects and responds to user emotional states
    """

    async def analyze_message(
        self,
        message: string,
        history: list[Exchange]
    ) -> EmotionalAssessment:
        """
        Analyze user's emotional state from message
        """

        # Classify emotion using LLM
        classification = await self.classify_emotion(message)

        # Track trend
        trend = self.calculate_trend(history, classification)

        # Determine response strategy
        response_strategy = self.determine_response_strategy(
            classification,
            trend
        )

        return EmotionalAssessment(
            state=classification,
            trend=trend,
            response_strategy=response_strategy
        )

    async def classify_emotion(self, message: string) -> EmotionClassification:
        """
        Use LLM to classify emotional content
        """

        prompt = f"""
Analyze the emotional content of this message:

"{message}"

Classify into:
Primary emotion: [neutral, excited, frustrated, anxious, confused, hopeless, motivated]
Intensity: [low, medium, high]
Mentions self-worth: [yes/no]  // "I'm not good enough", etc.
Duration mentioned: [number of days if mentioned, else null]
Specific trigger: [what caused this emotion, if clear]

Respond in JSON format.
        """

        response = await llm.complete(prompt)
        return EmotionClassification.from_json(response)

    def determine_response_strategy(
        self,
        classification: EmotionClassification,
        trend: EmotionalTrend
    ) -> ResponseStrategy:
        """
        Decide how to respond based on emotional state
        """

        # High-intensity negative emotions
        if classification.intensity == "high" and classification.primary_emotion in [
            "frustrated", "anxious", "hopeless"
        ]:
            return ResponseStrategy(
                tone="empathetic_first",
                structure="acknowledge_then_data",
                include_encouragement=True,
                avoid_pressure=True,
                check_for_escalation=True,
                suggested_opening=self.get_empathetic_opening(classification)
            )

        # Confusion
        if classification.primary_emotion == "confused":
            return ResponseStrategy(
                tone="clear_and_patient",
                structure="step_by_step",
                avoid_jargon=True,
                suggested_opening="Let me break this down clearly..."
            )

        # Excitement/motivation
        if classification.primary_emotion in ["excited", "motivated"]:
            return ResponseStrategy(
                tone="match_energy",
                structure="direct",
                encourage_momentum=True,
                suggested_opening="Love the energy! Let's keep it going."
            )

        # Default: professional and efficient
        return ResponseStrategy(
            tone="professional_warm",
            structure="direct",
            include_encouragement=False
        )

    def check_escalation(
        self,
        classification: EmotionClassification,
        trend: EmotionalTrend
    ) -> bool:
        """
        Determine if we should suggest professional help
        """

        escalation_signals = [
            classification.primary_emotion == "hopeless",
            classification.mentions_self_worth == True,
            trend == "declining" and classification.intensity == "high",
            classification.duration_mentioned and classification.duration_mentioned > 30
        ]

        # Need 2+ signals to escalate
        return sum(escalation_signals) >= 2

    def generate_escalation_response(
        self,
        classification: EmotionClassification
    ) -> string:
        """
        Sensitive response suggesting professional support
        """

        return """
I want to acknowledge what you're sharing - it sounds like you're going through
a really tough time, beyond just the job search itself.

While I can help with strategy and applications, if you're feeling overwhelmed
or struggling emotionally, it might be helpful to talk to someone qualified.

Resources:
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988
- SAMHSA Helpline: 1-800-662-4357

Your wellbeing matters more than any job search. Want to take a break and
focus on self-care for a bit?
        """
```

**Response Modifiers:**

```python
class EmotionalResponseAdapter:
    """
    Adapt Coach responses based on emotional state
    """

    def adapt_response(
        self,
        base_response: string,
        emotional_state: EmotionalState
    ) -> string:
        """
        Modify response to match user's emotional needs
        """

        if emotional_state.needs_support:
            # Add empathy opening
            opening = self.generate_empathy_statement(emotional_state)
            base_response = f"{opening}\n\n{base_response}"

        if emotional_state.current_state == "confused":
            # Simplify language, add structure
            base_response = self.simplify_and_structure(base_response)

        if emotional_state.current_state == "frustrated" and emotional_state.intensity == "high":
            # Remove any pressure language
            base_response = self.remove_pressure_language(base_response)

            # Add validation
            base_response += "\n\nThis is genuinely hard. You're not alone in feeling this way."

        return base_response

    def generate_empathy_statement(self, state: EmotionalState) -> string:
        """
        Generate appropriate empathy opening
        """

        if state.current_state == "frustrated":
            return "I can hear the frustration - and honestly, it's valid. Job searching is exhausting."

        elif state.current_state == "anxious":
            return "I understand this feels uncertain and stressful. Let's focus on what we can control."

        elif state.current_state == "hopeless":
            return "I'm hearing that you're feeling really discouraged. That's a tough place to be."

        return "I hear you."
```

**Why This Matters:**
- More human conversations
- Better retention during difficult moments
- Appropriate escalation when needed
- Builds trust through empathy

**Implementation Priority:** P1 (important for retention)

---

## 8. Implementation Notes (for v1)

### Technical Architecture

**The Coach will be implemented as an LLM-based system with:**

1. **System Prompt (Role & Constraints)**
   - Defines Coach persona, boundaries, and responsibilities (from this spec)
   - Embedded constraints from Section 3 (Non-Responsibilities)
   - Tone guidelines from Section 7 (Error Handling & Safety)

2. **Context Injection (Structured State)**
   - Summaries from Layers 2, 4, 5 (strategy, state, orchestrator)
   - Job candidates with scores and reasoning
   - User preferences and recent actions
   - **Format:** JSON or structured text, NOT raw database dumps

3. **User Message (Current Input)**
   - Latest user query or response

4. **Output Parsing**
   - Natural language response for user
   - Structured event extraction via function calling (see Section 5.B)

### 8.2 Context Window Management Strategy (NEW)

**Problem:** Context budget is limited (~2500 tokens) but we need to include:
- System prompt (500 tokens)
- Strategy context (200 tokens)
- User preferences (150 tokens)
- Active topic details (300 tokens)
- Recent exchanges (400 tokens)
- Optional: job candidates, pipeline, etc.

**Solution:** Dynamic context allocation based on conversation state.

**Architecture:**

```typescript
interface ContextBudget {
  total_budget: 2500;  // tokens

  // Fixed allocations (always included)
  fixed: {
    system_prompt: 500,
    strategy_context: 200,
    user_preferences: 150,
    response_reserve: 250  // Expected response length
  };

  // Dynamic allocations (based on conversation state)
  dynamic: {
    active_topic?: 300,        // If discussing specific job/plan
    recent_exchanges: 400,     // Last 5-7 turns (compressed)

    // Optional (include if budget allows)
    job_candidates?: 350,      // Top 3-5 matches
    recent_activity?: 200,     // Last week summary
    pipeline_summary?: 150     // Application stats
  };
}
```

**Implementation:**

```python
class ContextManager:
    """
    Manages context budget and compression
    """

    TOTAL_BUDGET = 2500  # tokens
    FIXED_BUDGET = 500 + 200 + 150 + 250  # 1100 tokens
    DYNAMIC_BUDGET = TOTAL_BUDGET - FIXED_BUDGET  # 1400 tokens

    def build_context(
        self,
        state: ConversationState,
        full_context: FullContext
    ) -> CompactContext:
        """
        Build context within budget

        Priority order:
        1. System prompt (always)
        2. Strategy context (always)
        3. User preferences (always)
        4. Active topic (if discussing something specific)
        5. Recent exchanges (compressed to fit)
        6. Job candidates (if in job discussion state)
        7. Recent activity (if budget allows)
        """

        budget_remaining = self.DYNAMIC_BUDGET
        context = CompactContext()

        # 1. Fixed context (always included)
        context.system = self.system_prompt  # 500 tokens
        context.strategy = self.compress_strategy(full_context.strategy)  # 200 tokens
        context.preferences = self.compress_preferences(full_context.preferences)  # 150 tokens

        # 2. Active topic (if applicable)
        if state in [ConversationState.EXPLAINING_JOB, ConversationState.COMPARING_JOBS]:
            if full_context.active_topic:
                context.active_topic = self.get_topic_details(
                    full_context.active_topic,
                    max_tokens=300
                )
                budget_remaining -= 300

        # 3. Recent exchanges (always include, but compress to fit)
        max_exchange_tokens = min(400, budget_remaining - 200)  # Reserve 200 for optional
        context.recent_exchanges = self.compress_exchanges(
            full_context.recent_exchanges,
            max_tokens=max_exchange_tokens
        )
        budget_remaining -= self.count_tokens(context.recent_exchanges)

        # 4. Optional: Job candidates (if in job-related state and budget allows)
        if budget_remaining >= 350 and state in [
            ConversationState.EXPLAINING_PLAN,
            ConversationState.EXPLAINING_JOB,
            ConversationState.COMPARING_JOBS
        ]:
            context.job_candidates = self.compress_job_list(
                full_context.jobs,
                max_tokens=350,
                top_n=3
            )
            budget_remaining -= 350

        # 5. Optional: Recent activity (if budget allows)
        if budget_remaining >= 200:
            context.recent_activity = self.compress_activity(
                full_context.recent_activity,
                max_tokens=200
            )

        return context

    def compress_strategy(self, strategy: StrategyContext) -> str:
        """
        Compress strategy context to key facts only
        """
        return f"""
Current Mode: {strategy.current_mode}
Reason: {strategy.mode_reasoning.primary_reason}
Weekly Target: {strategy.weekly_target.target_applications} applications
Progress: {strategy.progress_percentage}% complete
Next Checkpoint: {strategy.next_review_date}
        """.strip()

    def compress_exchanges(
        self,
        exchanges: list[Exchange],
        max_tokens: int
    ) -> str:
        """
        Compress conversation history to fit budget

        Strategy:
        - Keep last 3 exchanges full
        - Summarize older exchanges
        """

        if not exchanges:
            return ""

        # Keep most recent full
        recent = exchanges[-3:]
        older = exchanges[:-3]

        result = ""

        # Summarize older exchanges
        if older:
            topics = list(set(e.topic for e in older if e.topic))
            result += f"[Earlier: Discussed {', '.join(topics)}]\n\n"

        # Include recent full (but truncated if too long)
        for ex in recent:
            result += f"User: {self.truncate(ex.user_said, 50)}\n"
            result += f"Coach: {self.truncate(ex.coach_responded, 50)}\n\n"

        # If still over budget, truncate further
        if self.count_tokens(result) > max_tokens:
            result = self.smart_truncate(result, max_tokens)

        return result

    def compress_job_list(
        self,
        jobs: list[Job],
        max_tokens: int,
        top_n: int = 3
    ) -> str:
        """
        Compress job candidates to essentials
        """

        top_jobs = sorted(jobs, key=lambda j: j.match_score, reverse=True)[:top_n]

        result = "Top Job Matches:\n"
        for i, job in enumerate(top_jobs, 1):
            result += f"""
{i}. {job.title} at {job.company} ({job.location})
   Match: {job.match_score}/100
   Why: {job.match_reasons.primary_reason}
   Concerns: {job.concerns if job.concerns else "None"}
            """.strip() + "\n"

        return result
```

**Why This Matters:**
- Prevents context overflow errors
- Ensures consistent UX across conversations
- Prioritizes most relevant information
- Adapts to conversation state

**Implementation Priority:** P1 (important for UX)

### Context Management (Legacy)

**Critical constraint: Keep context compact**

- Use summaries (e.g., "23 applications, 5 last week") not full logs
- Limit job candidates to 3-5 top matches
- Recent actions limited to last 5-7 items
- Token budget for context: ~2000-3000 tokens max

**Separation of concerns:**
- Orchestrator computes decisions → provides summaries
- Coach explains decisions → emits events
- Coach does NOT recompute strategy or access raw DB

### Logging Requirements

**Must log for future Learning Engine:**

1. **User-facing messages:**
   - Full conversation history per session
   - Timestamps and context IDs

2. **Structured events emitted:**
   - All `UserPreferenceUpdated`, `UserConfirmedPlan`, etc. events
   - Linked to conversation turn that generated them

3. **Prompt/response metadata:**
   - System prompt version
   - Context summary (for debugging)
   - LLM parameters (model, temperature, etc.)

**Purpose:** This logging feeds Layer 7 (Learning Engine) for future prompt optimization and strategy improvement.

### Prompt Engineering Considerations

**Techniques for v1:**

- **Few-shot examples** for common flows (mode switches, job explanations)
- **Explicit constraints** in system message (e.g., "Never fabricate data")
- **Output formatting** instructions (e.g., "Always provide 2-3 options when uncertain")
- **Fallback behaviors** (e.g., "If you lack data, say so explicitly")

**Testing:**
- Unit tests for event extraction (given a message, parse correct event)
- Integration tests for key flows (mode switch, plan confirmation)
- Human evaluation of tone and clarity (spot-check 20-30 messages)

---

## 9. Production Safeguards (NEW)

### 9.1 Error Recovery Framework

**Purpose:** Handle failures gracefully without breaking user experience.

```typescript
interface ErrorRecoveryFramework {
  scenarios: {
    llm_timeout: {
      detection: "request_duration > 30s",
      user_message: "I'm having a moment - give me a second to think about that.",
      retry_strategy: "exponential_backoff",
      max_retries: 3,
      fallback: "I'm having trouble processing that right now. Could you try rephrasing, or should we pick this up in a few minutes?"
    },

    llm_error: {
      detection: "error_code in [500, 502, 503]",
      user_message: "Sorry, I'm experiencing technical difficulties. Let me try that again...",
      retry_strategy: "immediate_retry",
      max_retries: 2,
      fallback: "I'm having persistent technical issues. Your question is saved - I'll get back to you as soon as I'm back online."
    },

    stale_data: {
      detection: "context_timestamp > 1_hour_old",
      user_message: "Let me refresh your latest data...",
      action: "reload_from_layer_4",
      fallback: "I couldn't refresh your data. Using last known state from [TIMESTAMP]."
    },

    contradictory_context: {
      detection: "layer_2.mode != layer_4.current_mode",
      user_message: "I'm seeing some conflicting information in your data. Let me sort that out...",
      action: "reconcile_contexts",
      fallback: "I'm seeing inconsistent data. To be safe, let me verify: are you currently in [MODE] strategy?"
    },

    unknown_entity: {
      detection: "user_references_job_not_in_context",
      user_message: "I don't have details on that job in our current session. Could you paste the job link or share more details?",
      action: "request_clarification"
    },

    function_calling_failed: {
      detection: "tool_use_failed or malformed_args",
      user_message: "I understood what you said but had trouble recording it properly. Let me try that again...",
      retry_strategy: "rephrase_and_retry",
      fallback: "I'm having trouble processing that action. Could you rephrase what you'd like to do?"
    }
  };
}
```

### 9.2 Rate Limiting & Cost Management

**Purpose:** Prevent runaway costs and abuse.

```typescript
interface CostManagement {
  // Per-user limits
  user_limits: {
    free_tier: {
      messages_per_day: 20,
      messages_per_hour: 10,
      context_tokens_per_message: 2000
    },
    premium_tier: {
      messages_per_day: 100,
      messages_per_hour: 30,
      context_tokens_per_message: 3000
    }
  };

  // Cost optimization
  optimization: {
    // Use cheaper models for simple tasks
    use_haiku_for: [
      "simple_acknowledgments",  // "Got it", "Thanks"
      "clarifying_questions",    // "Which job do you mean?"
      "greeting_responses"       // "Hi! How can I help?"
    ],

    use_sonnet_for: [
      "strategy_explanations",
      "job_recommendations",
      "emotional_support",
      "complex_reasoning"
    ],

    // Cache common responses
    cache_static_responses: true,
    cache_ttl: 3600,  // 1 hour
    cacheable_patterns: [
      "What can you help me with?",
      "How does this work?",
      "What's my current strategy?"
    ]
  };

  // Monitoring & alerts
  alerts: {
    user_approaching_limit: {
      threshold: 0.8,  // 80% of daily limit
      message: "Heads up: You're approaching your daily message limit. [X] messages remaining today."
    },

    cost_spike_detected: {
      threshold: "10x_normal_usage",
      action: "alert_engineering_team",
      auto_throttle: false  // Manual decision
    },

    suspicious_activity: {
      patterns: ["rapid_fire_messages", "context_stuffing", "prompt_injection_attempt"],
      action: "rate_limit_aggressive"
    }
  };
}
```

### 9.3 Conversation Quality Metrics

**Purpose:** Measure if Coach is doing well.

```typescript
interface ConversationMetrics {
  // Per-conversation metrics
  conversation_level: {
    conversation_id: string,

    // Efficiency
    turns_to_task_completion: number,  // How many turns to complete intended task
    clarifications_needed: number,     // How many times user had to clarify
    topic_drift_count: number,         // How many times conversation went off-track

    // Quality
    user_satisfaction_signal: "thumbs_up" | "thumbs_down" | "no_signal",
    task_completed: boolean,           // Did user complete intended action
    events_extracted: number,          // How many structured events captured

    // Errors
    errors_occurred: number,
    error_types: string[],
    recovery_attempts: number,

    // Cost
    total_tokens_used: number,
    llm_calls_made: number,
    estimated_cost_cents: number
  };

  // Aggregate metrics (computed daily/weekly)
  aggregate: {
    // Effectiveness
    task_completion_rate: number,     // % of conversations where goal achieved
    avg_turns_per_task: number,       // Efficiency metric
    satisfaction_rate: number,        // % thumbs up / (thumbs up + thumbs down)

    // Reliability
    error_rate: number,                // % of conversations with errors
    avg_errors_per_conversation: number,
    retry_success_rate: number,        // When errors occur, do retries work?

    // Quality signals
    event_extraction_accuracy: number, // % of events correctly extracted (validated by Layer 4)
    clarification_rate: number,        // % of turns requiring clarification

    // Cost
    avg_cost_per_conversation_cents: number,
    total_daily_cost_dollars: number,
    cost_per_successful_task_cents: number,

    // Correlation analysis
    retention_correlation: number      // Do better conversations → better retention?
  };
}
```

### 9.4 A/B Testing Framework

**Purpose:** Test prompt variations and UX improvements.

```typescript
interface ABTestFramework {
  experiment_types: [
    "prompt_variants",        // Different system prompts
    "tone_variants",          // Formal vs casual
    "detail_level_variants",  // Brief vs detailed explanations
    "flow_variants",          // Different conversation flow templates
    "personalization_on_off"  // With/without personalization
  ];

  success_metrics: [
    "task_completion_rate",
    "user_satisfaction",
    "action_conversion_rate",  // Did they follow recommendation?
    "session_duration",
    "return_rate_7_day",
    "events_extracted_accuracy"
  ];
}
```

### 9.5 Fallback to Human Support

**Purpose:** Escalate when Coach can't help.

```typescript
interface HumanEscalation {
  triggers: [
    {
      signal: "user_mentions_mental_health",
      keywords: ["depressed", "hopeless", "can't go on", "worthless"],
      response: `I'm concerned about what you're sharing. While I can help with job search
                 strategy, if you're struggling emotionally, please reach out to a professional.`,
      log_for_review: true
    },
    {
      signal: "user_frustrated_after_multiple_attempts",
      detection: "3+ clarification requests in single conversation",
      response: `Would it help to schedule a quick call with a human career advisor?`,
      offer_human_option: true
    },
    {
      signal: "legal_or_discrimination_question",
      keywords: ["sue", "discriminate", "harassment"],
      response: `That's a legal question outside my expertise. I'd recommend speaking with an employment lawyer.`,
      redirect: true
    }
  ];
}
```

---

## 10. Competitive Moats & Differentiation (NEW)

**Reality Check:** Without these moats, Layer 8 can be replicated in 2-3 weeks by any competitor with Claude/GPT-4 access.

**Goal:** Build 12-18 month defensibility through proprietary assets and learned intelligence.

---

### 10.1 MOAT #1: Conversation Pattern Library (Defensibility: 80/100)

**Purpose:** Library of proven conversation patterns learned from 10,000+ successful user interactions.

**Architecture:**

```typescript
interface ConversationPatternLibrary {
  /**
   * Patterns learned from analyzing successful conversations
   *
   * Competitors would need 10K+ conversations + analysis to replicate
   * Time to build: 12+ months
   */

  // Objection handling patterns
  objection_responses: Array<{
    objection_type: "strategy_doubt" | "job_mismatch" | "time_pressure" | "frustration";

    // Context signals that indicate this objection
    context_signals: string[];  // ["no_interviews_after_30_apps", "user_mentions_time"]

    // Response patterns that worked
    effective_responses: Array<{
      response_template: string;
      success_rate: number;        // % of users satisfied after this response
      sample_size: number;          // How many times tried
      avg_follow_up_turns: number;  // How many turns to resolution
      user_satisfaction: number;    // Post-conversation rating
    }>;

    // What NOT to say
    ineffective_responses: Array<{
      response_template: string;
      failure_indicators: string[];  // What went wrong
      sample_size: number;
    }>;
  }>;

  // Preference elicitation patterns
  preference_flows: Array<{
    preference_type: string;  // "work_arrangement", "salary", "location"

    // Optimal question sequence
    best_question_sequence: Array<{
      question: string;
      timing: "upfront" | "contextual" | "after_data";
      completion_rate: number;  // % who answer
    }>;

    avg_turns_to_complete: number;
    user_annoyance_rate: number;  // % who express frustration during flow
  }>;

  // Emotional support patterns
  support_patterns: Array<{
    emotional_signal: "discouraged" | "anxious" | "frustrated" | "stuck";
    severity: "low" | "medium" | "high";

    // What helps
    effective_response_style: string;  // "empathy_first", "data_driven", "action_oriented"

    // Follow-up questions that work
    followup_questions: string[];

    // When to escalate to human
    escalation_triggers: string[];
  }>;

  // Strategy transition patterns
  strategy_transition_flows: Array<{
    from_mode: StrategyMode;
    to_mode: StrategyMode;
    common_user_concerns: string[];
    effective_explanations: string[];
    acceptance_rate: number;
  }>;
}
```

**Why This Creates Moat:**

- **Data Requirement:** Need 10,000+ conversations with outcome data
- **Analysis Requirement:** Sophisticated pattern extraction + statistical validation
- **Time to Build:** 12+ months to accumulate data + build analysis pipeline
- **Time to Replicate:** Competitor needs same data volume + analysis (12-18 months minimum)

---

### 10.2 MOAT #2: Personalized Communication Model (Defensibility: 75/100)

**Purpose:** Learn each user's preferred communication style and adapt automatically.

**Architecture:**

```typescript
interface UserCommunicationProfile {
  user_id: string;

  // Learned communication preferences
  communication_style: {
    // Detail level
    preferred_detail_level: "brief" | "moderate" | "detailed";
    detail_examples: {
      brief_preferred: boolean;      // Responds better to <50 word responses
      detailed_preferred: boolean;   // Engages more with detailed explanations
    };

    // Data vs narrative
    prefers_data_first: boolean;     // "Show numbers first" vs "Tell story first"
    data_to_narrative_ratio: number; // Optimal mix for this user

    // Decision making
    response_to_uncertainty: "wants_options" | "wants_recommendation" | "wants_to_decide";

    // Encouragement
    prefers_encouragement: boolean;  // Responds to motivational language
    encouragement_frequency: "high" | "moderate" | "low";

    // Formality
    formality_preference: "casual" | "professional" | "formal";

    // Question asking
    asks_lots_of_questions: boolean;
    prefers_proactive_info: boolean;  // Or waits to be asked
  };

  // Learned from behavior
  engagement_patterns: {
    avg_message_length: number;
    avg_response_time: number;
    typical_session_duration: number;
    asks_followup_questions: boolean;
    completes_recommended_actions: boolean;
  };

  // What works for THIS user (learned from feedback)
  effectiveness_data: {
    best_explanation_style: string;    // Learned from thumbs up/down
    topics_that_resonate: string[];
    topics_to_avoid: string[];

    effective_response_patterns: Array<{
      pattern: string;
      user_satisfaction: number;
      completion_rate: number;
    }>;
  };

  // Temporal patterns
  temporal: {
    most_active_times: string[];      // When they engage most
    typical_session_frequency: string; // Daily, weekly, etc.
    response_urgency: "immediate" | "same_day" | "flexible";
  };

  // Last updated
  profile_confidence: number;  // 0-1, based on data volume
  last_updated: string;
  conversations_analyzed: number;
}
```

**Why This Creates Moat:**

- **Data Requirement:** Need per-user interaction history (20+ conversations to build reliable profile)
- **Retention Requirement:** Users must stay long enough to accumulate data
- **Time to Build:** 6+ months to build profiles for user base
- **Time to Replicate:** Competitor needs same user retention + analysis (6-12 months)

---

### 10.3 MOAT #3: Proactive Coaching Intelligence (Defensibility: 70/100)

**Purpose:** Don't wait for user to ask - anticipate needs and reach out proactively.

**Architecture:**

```typescript
interface ProactiveCoachingEngine {
  /**
   * Monitors user state and proactively suggests actions
   *
   * NOT reactive ("user asks, I answer")
   * but PROACTIVE ("I notice pattern, I reach out")
   */

  async checkForProactiveOutreach(
    user_id: string
  ): Promise<ProactiveMessage | null> {
    // Check all trigger conditions
    const triggers = await Promise.all([
      this.checkInactivityTrigger(user_id),
      this.checkMilestoneAchieved(user_id),
      this.checkPatternDetected(user_id),
      this.checkTimeSensitiveOpportunity(user_id),
      this.checkEmotionalCheckIn(user_id),
      this.checkInconsistencyDetected(user_id)
    ]);

    // Find highest priority trigger
    const activeTrigger = triggers
      .filter(t => t.should_trigger)
      .sort((a, b) => b.priority - a.priority)[0];

    if (!activeTrigger) return null;

    return {
      message: await this.generateProactiveMessage(activeTrigger),
      trigger_reason: activeTrigger.reason,
      priority: activeTrigger.priority,
      expected_value: activeTrigger.expected_impact
    };
  }
}
```

**Example Proactive Patterns:**

```python
# Pattern: User keeps rejecting recommended jobs
if user_data.rejection_rate > 0.7 and user_data.applications_last_week < 5:
    message = """
I've noticed you've been passing on most of the jobs I've recommended this week.
That's totally fine - but I want to make sure I'm understanding what you're looking for.

Is there something specific about these roles that's not working?
Or should we adjust your preferences?
    """

# Pattern: Applying but not customizing resumes
if user_data.applications_last_week > 5 and user_data.resume_customization_rate < 0.2:
    message = """
Quick observation: You've applied to 6 jobs this week, which is great momentum!

However, I noticed most applications went out with the generic resume.
Since your interview rate is currently low, tailoring your resume to each job could really help.

Want me to show you which sections to customize for your next application?
    """

# Pattern: User preference conflicts with behavior
if (user_data.stated_preferences.work_arrangement == "remote" and
    user_data.recent_applications_remote_rate < 0.3):
    message = """
I noticed something interesting: Your preferences say you want remote roles,
but most of your recent applications have been for onsite/hybrid positions.

Two possibilities:
1. You're more flexible than your preferences suggest (totally fine!)
2. I'm not finding enough good remote roles

Which is it? Want me to adjust anything?
    """
```

**Why This Creates Moat:**

- **Pattern Detection:** Requires sophisticated analysis of user behavior
- **Timing Optimization:** Need to learn when to reach out (not too early, not too late)
- **Message Personalization:** Proactive messages must feel helpful, not annoying
- **Time to Build:** 6+ months to build reliable triggers
- **Time to Replicate:** 6-9 months

---

### 10.4 MOAT #4: Integrated Causal Insights from Layer 7 (Defensibility: 90/100)

**Purpose:** Coach doesn't just give generic advice - explains CAUSALITY learned from Layer 7.

**Example:**

```
User: "Should I add metrics to my bullets?"

GENERIC ADVICE (competitors):
"Yes, adding metrics to your resume is generally a good practice.
It helps quantify your impact."

CAUSAL ADVICE (us):
"Based on data from 847 users with similar backgrounds to you, adding specific
metrics to experience bullets increases interview rates by about 15%.

This isn't just correlation - we tracked users who made this change and compared
them to similar users who didn't (same resume score, years of experience, target
roles). The effect was consistent across all subgroups.

For context: users who added 2-3 metrics per role saw the biggest improvement.
More than that had diminishing returns.

Want me to identify which of your bullets would benefit most from metrics?"
```

**Why This is 90/100 Defensible:**

- Requires Layer 7 causal inference engine (18 months to build)
- Requires longitudinal outcome data (12+ months of tracking)
- Requires statistical expertise (PhD-level econometrics)
- Creates unique, science-backed value proposition
- Extremely hard to replicate without full backend

---

### 10.5 Combined Moat Strategy

**Defensive Layers:**

```
Layer 1: Causal Insights Integration     (18-24 months to replicate)
Layer 2: Conversation Pattern Library    (12-18 months)
Layer 3: Personalized Communication      (6-12 months)
Layer 4: Proactive Coaching              (6-9 months)

Combined Time to Replicate: 18-24 months minimum
Combined Cost to Replicate: $300K+ (engineering + data collection)
```

**Result:** Layer 8 goes from "2 weeks to copy" to "18+ months to replicate"

**Implementation Timeline:**

- **v1 (MVP):** Basic Coach without moats (3 months)
- **v1.1:** Add conversation state tracking for pattern learning (Month 4)
- **v2.0:** Deploy Conversation Pattern Library (Month 6-9, after 5K+ conversations)
- **v2.1:** Deploy Personalized Communication (Month 9-12, after retention data)
- **v2.2:** Deploy Proactive Coaching (Month 12-15, after pattern validation)
- **v3.0:** Full Layer 7 integration for causal explanations (Month 15-18)

---

## 11. Open Questions / Future Work

**Explicitly out of scope for v1:**

### Multi-Language Support
- v1 is English-only
- Future: Detect user language, localize prompts and responses

### Deep Emotional Modeling
- v1 acknowledges stress but doesn't model emotional states over time
- Future: Track user sentiment trends, proactively adjust communication style

### Personalized Tone per User
- v1 uses a single professional-empathetic tone for all users
- Future: Adapt formality, humor, directness based on user preference

### Proactive Outreach
- v1 is reactive (responds when user engages)
- Future: Ping user if inactive for X days, suggest check-ins

### Advanced Interview Coaching
- v1 can point to resources and do basic mock questions
- Future: Real-time interview simulation with scoring and feedback

### Multi-Modal Interactions
- v1 is text-only
- Future: Voice conversations, screen sharing for resume review

### Coach Memory Across Sessions
- v1 reloads context from state each session
- Future: Coach maintains conversational continuity ("Last time we talked about X...")

### Adaptive Explanation Depth
- v1 provides fixed-depth explanations
- Future: Learn per-user preference for detail level (some want TL;DR, others want full reasoning)

---

**End of Specification**

This document defines Layer 8 (AI Coach Interface) for Agent v2 architecture, v1 MVP implementation.

**Related Docs:**
- `agent_architecture_v2.md` — Full 8-layer system
- `Agent_MVP_Scope_v1.md` — What's in v1 vs v2
- `data_model_v1.md` — Database schema and state structure
- `migration_guide.md` — Mapping from old 4-engine to new 8-layer system
