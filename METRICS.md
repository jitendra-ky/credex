# METRICS.md

**Word count target: 200–500 words**

---

## North Star Metric

**Qualified Leads Captured per Week** — defined as email submissions from users whose audit showed ≥$100/month in savings potential.

### Why This Metric

The Credex audit tool exists to drive lead generation for credit sales. "Audits completed" is a vanity metric — it counts the person who fills two fields and closes the tab. "Leads captured" is too broad — it counts every email submission, including the person whose $10/month Gemini free-tier audit generates zero actionable findings.

The qualified lead (≥$100/mo savings) is the metric that maps to revenue: these are the companies that have real overspend, are emotionally primed to act on it, and have enough AI spend to make a Credex credit conversation worthwhile. Track this weekly because the B2B buying cycle is weekly (budget reviews, renewal conversations, CFO emails happen on cadences, not daily).

---

## 3 Input Metrics That Drive the North Star

### 1. Audit Completion Rate
**Definition:** % of users who load the spend form and reach the results page.  
**Target:** ≥60%  
**Why it matters:** If people bail mid-form, we have a UX problem, not a GTM problem. Every point of completion rate improvement directly amplifies the lead capture denominator.

### 2. Email Capture Rate (on high-savings audits)
**Definition:** % of users who see ≥$100/mo in savings and submit their email.  
**Target:** ≥25%  
**Why it matters:** This is the conversion event that creates a lead. Low capture rate means the value proposition isn't landing, the form is too intrusive, or the prompt is poorly timed. A/B test copy, placement, and incentive here before anything else.

### 3. Share Link Click-Through Rate
**Definition:** % of completed audits where the unique share URL is opened by someone other than the original user.  
**Target:** ≥15%  
**Why it matters:** The share link is the primary organic growth loop. If CTOs are sharing audits with their CFOs and finance teams (as user interview 2 revealed), each share is a warm distribution touchpoint with zero CAC. A high CTR here means the product is doing distribution work for us.

---

## What We'd Instrument First

1. **Funnel events:** `audit_form_started`, `audit_form_submitted`, `results_viewed`, `email_captured`, `share_link_created`, `share_link_opened` — in PostHog or Mixpanel
2. **Per-tool savings distribution:** How often does each rule fire? Which tools generate the most savings findings? (Informs which tools to audit more deeply, and which pricing data to prioritise keeping fresh)
3. **Email capture rate by audit tag:** Capture rate for `high-savings` vs `medium` vs `optimal` audits — validates the tiered CTA strategy

---

## What Number Triggers a Pivot Decision

If, after 500 completed audits, the qualified lead capture rate is below 8% (vs 25% target), it means:

- Either the audit results aren't credible enough for users to trust us with their email, **or**
- The form is capturing users without real AI spend (wrong audience)

At that point, the intervention is **not** to double down on acquisition — it's to interview 10 users who completed the audit and did not submit their email. The answer will be in that conversation.

The pivot trigger is not a DAU number or an engagement metric. It's "are we producing qualified leads at a rate that makes the Credex economics work?" At 500 audits, you have enough signal to know.
