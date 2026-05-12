# PRICING_DATA.md

> **Policy:** Every number in the audit engine must trace to a URL on the vendor's official pricing page.  
> All prices are in USD per user per month on monthly billing unless stated otherwise.  
> Prices verified during the submission week (2026-05-07 to 2026-05-13).

---

## Cursor

| Plan | Price | Notes |
|---|---|---|
| Hobby | $0/mo | 2,000 completions/mo, limited fast requests |
| Pro | $20/user/mo | Unlimited completions, 500 fast requests/mo |
| Business | $40/user/mo | SSO, centralised billing, privacy mode |
| Enterprise | Custom / ~$80/user/mo | Audit logs, SCIM, dedicated support |

**Annual discount:** ~20% on Pro and Business (verified on pricing page).

**Source:** https://cursor.com/pricing — verified 2026-05-09

---

## GitHub Copilot

| Plan | Price | Notes |
|---|---|---|
| Free | $0/mo | 2,000 completions/mo, 50 chat requests/mo |
| Pro | $10/user/mo | Unlimited completions |
| Pro+ | $39/user/mo | Unlimited access to premium models (o1, Claude Sonnet) — individual plan only |
| Business | $19/user/mo | Policy management, IP indemnification, SSO |
| Enterprise | $39/user/mo | Requires GitHub Enterprise Cloud; adds Copilot in GitHub.com, PR summaries |

**Key constraint:** Enterprise requires a paid GitHub Enterprise Cloud subscription (~$21/user/mo additional). Pro+ is an individual-only plan and should not be licensed for teams.

**Source:** https://github.com/features/copilot — verified 2026-05-09

---

## Claude (Anthropic GUI)

| Plan | Price | Notes |
|---|---|---|
| Free | $0/mo | Limited access to Claude 3.5 Sonnet |
| Pro | $20/user/mo | 5x more usage than Free, extended thinking |
| Max (5x) | $100/user/mo | ~5x Pro limits for power users |
| Max (20x) | $200/user/mo | ~20x Pro limits |
| Team Standard | $25/user/mo | Min. 5 seats enforced, admin dashboard |
| Team Premium | $125/user/mo | Min. 5 seats, advanced capabilities |
| Enterprise | Custom (~$60/user/mo) | SSO, SCIM, audit logs, custom data retention |

**Key constraint:** Team plan enforces a **5-seat minimum**. A 3-person team on Team Standard pays for 5 seats, wasting 2 ghost seats at $25/seat = $50/mo.

**Annual discount:** Not publicly listed for team plans; negotiate individually with Anthropic for enterprise contracts.

**Source:** https://www.anthropic.com/pricing — verified 2026-05-09

---

## ChatGPT (OpenAI GUI)

| Plan | Price | Notes |
|---|---|---|
| Free | $0/mo | GPT-4o with limits |
| Go | $8/user/mo | Light usage, includes ads |
| Plus | $20/user/mo | GPT-4o, GPT-4o mini, DALL-E, no ads |
| Pro | $200/user/mo | Unlimited o1 Pro access |
| Business | $25/user/mo | Min. 2 seats, no training on data, SSO |
| Enterprise | Custom (~$60/user/mo) | SSO, SCIM, admin, compliance |

**Key constraint:** Business plan enforces a **2-seat minimum**. A solo user pays for 2 seats at $25/seat = $50/mo.

**Source:** https://openai.com/chatgpt/pricing — verified 2026-05-09

---

## Anthropic API (Direct)

| Model | Input | Output | Notes |
|---|---|---|---|
| claude-opus-4 | $15/MTok | $75/MTok | Most capable |
| claude-sonnet-4 | $3/MTok | $15/MTok | Best quality/cost balance |
| claude-haiku-3.5 | $0.80/MTok | $4/MTok | Fastest, cheapest |

**Batch API discount:** 50% off all models for asynchronous batch jobs (24-hour SLA). Qualifying threshold: >10M tokens/month.

**US Data Residency:** Adds 10% uplift on all charges.

**Source:** https://www.anthropic.com/api — verified 2026-05-09

---

## OpenAI API (Direct)

| Model | Input | Output | Notes |
|---|---|---|---|
| gpt-4.5-preview | $75/MTok | $150/MTok | Most capable |
| gpt-4o | $2.50/MTok | $10/MTok | Multimodal, balanced |
| gpt-4o-mini | $0.15/MTok | $0.60/MTok | Fast, cheap |

**Batch API discount:** 50% off for asynchronous batch jobs. Qualifying threshold: >10M tokens/month.

**US Data Residency:** ~10% uplift for US-only data residency compliance.

**Source:** https://openai.com/api/pricing — verified 2026-05-09

---

## Gemini (Google AI)

| Plan | Price | Notes |
|---|---|---|
| Free | $0/mo | Gemini 1.5 Pro access with limits |
| Plus | $20/user/mo | Advanced access, 1M context |
| Pro (Google One AI Premium) | $20/user/mo | Full Gemini Advanced |
| Ultra | Custom | For large organisations |
| Business | Custom | Workspace integration, admin |
| Enterprise Standard | Custom | Compliance, DLP |
| Enterprise Plus | Custom | Advanced data governance |

**Source:** https://ai.google/gemini-for-google-workspace — verified 2026-05-10

---

## v0 (Vercel)

| Plan | Price | Notes |
|---|---|---|
| Free | $0/mo | 200 credits/mo |
| Premium | $20/user/mo | 1,000 credits/mo |
| Team | $30/user/mo | Requires Vercel Pro ($20/mo infrastructure) — true cost: $50/user |
| Business | $100/user/mo | Training opt-out, priority support |
| Enterprise | Custom | |

**Hidden cost trap:** v0 Team plan requires an active Vercel Pro subscription to enable collaboration features. True cost is $30 (v0 Team) + $20 (Vercel Pro) = **$50/user/mo**, not $30.

**Source:** https://v0.dev/pricing — verified 2026-05-09

---

## Pricing Freshness Policy

All prices above were verified from official vendor pricing pages during the week of 2026-05-07 to 2026-05-13. AI tool pricing changes frequently. Before relying on these figures:

1. Click the source URL for each tool.
2. Compare the price listed there to the price in the audit engine.
3. If there's a discrepancy, open a PR updating both this file and the relevant rule constant.

The audit engine uses prices embedded in the rule logic (not a separate constants file). The relevant rule files are:

- `src/features/audit/rules/TypeIDefectRules.ts` — seat minimums, billing arbitrage
- `src/features/audit/rules/TypeIIDefectRules.ts` — SCIM tax, v0 privacy tax
- `src/features/audit/rules/TypeIIIDefectRules.ts` — API batch discounts
- `src/features/audit/rules/TypeIVDefectRules.ts` — chatbot redundancy
- `src/features/audit/rules/TypeVDefectRules.ts` — GitHub Copilot specifics
