# ECONOMICS.md — Unit Economics

**Word count target: 300–700 words**

---

## What a Converted Lead Is Worth to Credex

Credex sells discounted AI infrastructure credits — Cursor, Claude, ChatGPT Enterprise, and others — at a real discount to retail. Let's estimate the value of one converted customer.

**Assumptions (conservative):**
- Average company using this tool has $500–$2,500/mo in AI spend
- Credex margin is 8–15% on credits sold (typical for credit resellers)
- Customers buy through Credex for 6–18 months before either churning or internalising procurement

**LTV calculation for one converted customer:**

| Scenario | Monthly AI Spend | Credex Margin | Months Active | LTV |
|---|---|---|---|---|
| Small (5-person team) | $500/mo | 10% = $50/mo | 12 months | **$600** |
| Mid (15-person team) | $1,500/mo | 10% = $150/mo | 12 months | **$1,800** |
| Large (30-person team) | $3,000/mo | 10% = $300/mo | 18 months | **$5,400** |

**Blended estimate:** ~$1,500–$2,500 LTV per converted customer. Let's use **$2,000 LTV** as the working number.

---

## CAC at Each GTM Channel

| Channel | Effort | Estimated Leads | Estimated Conversions (2%) | CAC |
|---|---|---|---|---|
| HN Show HN (1 post) | 3h writing | 200 audits → 60 leads | 1–2 Credex customers | ~$0 cash / $150 opportunity cost |
| Slack communities (3 posts) | 2h | 80 audits → 25 leads | ~0.5 customers | ~$0 cash |
| Direct outreach (20 startups) | 4h | 20 audits → 8 leads | ~0.2 customers | ~$0 cash / $200 opportunity cost |
| Newsletter guest post | 2h writing | 300 audits → 90 leads | ~2 customers | ~$0 cash / $100 opportunity cost |
| **All above combined** | **11h** | **600 audits → 180 leads** | **~4 customers** | **$0 cash CAC / ~$550 opportunity cost** |

At $2,000 LTV per customer and ~$550 opportunity cost for the first 4 customers, this is **CAC:LTV of ~1:14.5** — extremely healthy for B2B.

The audit tool itself is the free distribution mechanism. There is no paid acquisition here.

---

## Conversion Funnel Math

Working backwards from the funnel:

```
Cold visitor lands on site
        ↓ (100%)
Fills out spend form and submits
        ↓ (60–70%) [users who start the form and complete it]
Sees audit results
        ↓ (25–35%) [email capture rate for >$500/mo savings users]
Email captured as lead
        ↓ (8–12%) [Credex outreach → interested in credit purchase]
Consultation booked
        ↓ (50–70%) [of consultations that convert to a credit purchase]
Credex credit sale
```

**Break-even analysis:**
- 1,000 audits/month
- 650 complete (65% completion rate)
- 160 email captures (25% capture on >$500/mo savings cases + 5% capture on lower-savings cases)
- 13 consultations (8% of leads)
- 8 credit purchases (60% close rate)
- 8 × $2,000 LTV = **$16,000 revenue attributed to the audit tool**

At 1,000 audits/month, the tool generates ~$16,000/month in attributable Credex revenue — with effectively $0 ongoing operating cost (hosting is free on Vercel + Neon free tier up to ~5,000 audits/month).

---

## What Would Have to Be True for $1M ARR in 18 Months

**$1M ARR ÷ $2,000 LTV = 500 converted customers.**

Working backwards:
- 500 converted customers / 18 months = ~28 new customers/month
- At 60% consultation close rate → ~47 consultations/month
- At 8% lead → consultation rate → ~585 leads/month
- At 25% email capture → ~2,340 audits/month with >$500/mo savings findings

**Is 2,340 audits/month achievable in month 18?** Yes, if:
1. The HN launch drives 500–1,000 audits on day 1
2. Organic SEO for "AI spend audit", "cursor vs copilot cost" etc. builds to 500/mo by month 6
3. Word-of-mouth referrals from converted customers grow to 1,000/mo by month 12
4. Credex's existing B2B relationships generate 300–500 warm audits/month by month 9

The constraint is not the technology — it's getting qualified users to run audits. The viral share link (every shared audit result is a distribution touchpoint) is the organic growth lever that makes this feasible without paid ads.

---

## Sensitivity Analysis

The model is most sensitive to two variables:

| Variable | Base | Bear | Bull |
|---|---|---|---|
| Email capture rate | 25% | 10% | 40% |
| LTV per customer | $2,000 | $800 | $5,000 |
| Revenue/1,000 audits | $16,000 | $2,500 | $60,000 |

Even in the bear case ($2,500/1,000 audits), the tool is cash-flow positive from day 1 given $0 CAC. The bull case requires Credex to sell to larger companies — achievable if the enterprise-tier CTA on the results page is tuned for CTOs at 50+ person companies.
