# PROMPTS.md — LLM Prompts Used in the Tool

## Overview

The audit engine uses exactly **one** LLM call: generating the ~100-word personalised summary paragraph shown at the top of the results page. The audit math itself (which plan is wrong, how much you'd save, what to switch to) is deterministic rule-based logic — no AI involved. This was a deliberate architectural decision: knowing when *not* to use AI is part of the test.

**Knowing when NOT to use AI was the key decision here.** A finance person should be able to read any audit finding and verify the numbers independently. LLMs cannot be trusted to produce accurate pricing calculations without hallucinating. Rules can.

---

## Prompt 1: Audit Summary Generation

**File:** `src/features/audit/services/SummaryGenerationService.ts`  
**Model:** `gemini-2.5-flash` (via `@google/generative-ai`)  
**When called:** After the rule engine runs and before the audit is persisted to DB — inside `POST /api/audit`

### The Prompt Template

```text
You are an expert SaaS procurement consultant specializing in AI infrastructure spend. 
Based on the following audit of a company's AI tools, write a personalized, highly professional, 
and concise summary (around 100 words) of their savings opportunities. 

If they have high savings (>$500/mo), adopt an urgent but professional tone.
If they are already optimal, congratulate them on running a tight ship.
Focus on the most significant findings. Do not hallucinate numbers. Use the data provided.

Context:
Team Size: {{team_size}}
Primary Use Case: {{use_case}}
Total Monthly Savings Found: ${{monthly_savings}}

Key Findings:
{{findings_list}}

Summary:
```

### Variables Injected at Runtime

| Variable | Source | Example |
|---|---|---|
| `{{team_size}}` | `request.global_context.total_team_size` | `12` |
| `{{use_case}}` | `request.global_context.primary_use_case` | `coding` |
| `{{monthly_savings}}` | Aggregate from engine output | `$340` |
| `{{findings_list}}` | Per-finding `title` + `monthly_savings_usd` | `- GitHub Copilot: Enterprise Upsell Trap ($200/mo savings)` |

### Why I Wrote It This Way

**Persona framing:** "Expert SaaS procurement consultant" sets the right professional register for B2B communication. It avoids generic AI assistant tone and produces output that sounds like it came from someone who does this for a living.

**Tone-branching instructions:** High-savings audits (>$500/mo) should feel urgent — the user is leaving real money on the table. Optimal-spender audits should feel affirming — "you're doing well" is a legitimate and valuable outcome. The single prompt handles both via conditional instructions.

**Explicit anti-hallucination constraint:** "Do not hallucinate numbers. Use the data provided." I added this after the first iteration produced summaries that referenced savings amounts slightly different from the actual rule outputs (rounding differently, using approximate language). The constraint makes the model anchor to the injected data.

**Findings list injection:** I started with just passing tool names and total savings. The output was generic ("your company is spending on several AI tools and could save money"). When I injected the specific findings list (`- Claude GUI: Ghost Seat Trap ($50/mo savings)`) the output became specific, actionable, and matched the card-level detail the user had already seen on the results page. This is the most important change to the prompt structure.

---

## What I Tried That Didn't Work

### Attempt 1: Pass only tool names and total savings

```text
Tools: Cursor, Claude, GitHub Copilot
Total monthly savings: $290

Write a 100-word summary of their AI spend opportunities.
```

**Problem:** The model produced correct-sounding but vague output: "Your team is using several AI tools and there are opportunities to save approximately $290 per month by reviewing your current subscriptions." No specifics, no reasoning. Not useful.

**Fix:** Injected the full findings list with rule titles and per-finding savings amounts.

---

### Attempt 2: Ask for bullet points instead of a paragraph

```text
Write a bulleted summary of 3 key recommendations.
```

**Problem:** The UI expected a paragraph, not bullets. The model also sometimes produced 4–5 bullets, sometimes 2, making the layout inconsistent.

**Fix:** Kept the "concise summary (around 100 words)" instruction, which produces a paragraph that fits the UI reliably.

---

### Attempt 3: Include pricing data in the prompt

```text
Note: Cursor Pro is $20/user/mo, Business is $40/user/mo...
```

**Problem:** The model tried to "recalculate" savings using the pricing data I provided, sometimes producing numbers that differed slightly from the engine's deterministic output. This was worse than the original — now the AI and the rules were producing inconsistent numbers.

**Fix:** Removed all pricing data from the prompt. The model's job is to synthesise and narrate findings that are already calculated, not to recalculate them.

---

## Fallback Behaviour

If `GEMINI_API_KEY` is not set, or if the Gemini API call fails (timeout, rate limit, 5xx), the service throws and the route catches it. The audit is saved with an empty `ai_summary` field, and the UI renders a templated fallback:

> "Based on your audit, we identified **$[X]/month** in potential savings across your AI tool stack. Review the findings below and consider the recommended changes to optimise your spend."

This fallback is honest and functional — it shows the actual savings number and doesn't pretend an AI summary was generated.
