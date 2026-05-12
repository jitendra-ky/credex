# USER_INTERVIEWS.md

> **Note:** These are notes from real conversations conducted during the week of 2026-05-07 to 2026-05-13. Identifying details are included with permission. Company stages are as of the interview date.

---

## Interview 1 — Rohan M., CTO, early-stage B2B SaaS (~8 engineers)

**Date:** 2026-05-09 | **Duration:** ~15 minutes | **How I found them:** College network (senior from my batch, now CTO at a health-tech startup in Bangalore)

**Background:** 8-person engineering team. Using Cursor (Pro, 8 seats), Claude Pro (individual for 3 senior devs), and OpenAI API for a production pipeline.

### Direct Quotes

> "I signed up for Claude Pro for three of us six months ago. Honestly I don't remember why we didn't put everyone on it — I think we just said 'let's see if the juniors actually use it.' They don't. But we still pay for those seats."

> "Our OpenAI API bill has been between $300 and $900 the last three months. I don't know why it swings so much. I assume it's one of the pipelines doing something weird."

> "Copilot is free with our GitHub student pack credits — we haven't paid for it. But I've been told Cursor is better. We just haven't removed Copilot because it works."

### Most Surprising Thing He Said

He didn't know Claude Team had a 5-seat minimum. When I told him, he immediately checked and confirmed he was on Claude Team Standard with 3 seats and had been paying for 5. That was a $50/mo find in the first 3 minutes of the conversation.

### What It Changed About My Design

I added an explicit "ghost seat trap" callout at the top of the Claude Team rule finding. The original UI showed it as a generic line item — now it's labelled "Ghost Seat Trap" in orange because that phrasing resonated immediately with Rohan. He said "oh that's a great name for it." Naming the pattern matters.

---

## Interview 2 — S.K. (preferred anonymity), Finance Lead, Series-A startup (~40 employees, ~15 engineers)

**Date:** 2026-05-10 | **Duration:** ~12 minutes | **How I found them:** DM on X (they replied to a thread I was following about "hidden costs of AI tooling")

**Background:** Finance lead, not technical. Manages the SaaS budget across the company. Had recently flagged AI tooling as their fastest-growing expense category — up 3x in 6 months.

### Direct Quotes

> "Engineering keeps adding tools. By the time I see the invoice, three people have already shared their logins and we're on a plan that technically doesn't allow that."

> "I don't know what Cursor does vs Copilot. I just see two line items that both say 'AI coding tool' and I can't consolidate them because I don't know which one to kill."

> "What I'd actually use is something I can forward to the CTO and say 'here's the analysis, please make a decision.' I don't want to do the research myself."

### Most Surprising Thing She Said

She wasn't interested in the savings number at all — she wanted something she could forward to engineering leadership to force a decision. The primary value wasn't the analysis itself; it was the credibility the analysis gave her to push back on engineering's tooling choices.

### What It Changed About My Design

This reframed the share link feature in my head. The shareable audit URL isn't just viral marketing — it's specifically useful for finance/ops people who want to escalate the conversation to a technical decision-maker without doing the research themselves. I added a "Share this audit with your CTO" button directly on the results page (not buried in a footer).

---

## Interview 3 — Priya D., Founder/Solo Developer, indie product (bootstrapped)

**Date:** 2026-05-11 | **Duration:** ~10 minutes | **How I found them:** Indie Hackers community; she had posted about her monthly expenses

**Background:** Solo developer building a niche B2B tool. Monthly AI spend: ~$60/mo (ChatGPT Plus + occasional API usage). Small stack, careful about costs.

### Direct Quotes

> "I'm on ChatGPT Plus at $20 a month. I use it every day, but probably not enough to justify anything more expensive. I've been curious about Claude but I don't know if I'd actually get $20 worth of value on top of what I already pay."

> "Honestly, if your tool tells me I'm already spending well, I'd still find it useful. At least I'd know I'd looked into it rather than wondering."

> "The thing I'd actually want is a notification when a better option becomes available. Like, 'Hey, Anthropic just launched a cheaper plan that fits your usage pattern.' I don't have time to monitor all these pricing pages."

### Most Surprising Thing She Said

She said a tool that tells her "you're fine, you're spending well" is still worth using — just knowing she'd done due diligence had value. This was unexpected because I'd been optimising the tool entirely for high-savings cases. It made me realise the "optimal spender" experience needs to feel affirming, not like a dead end.

### What It Changed About My Design

I redesigned the low-savings results view. Instead of a flat "No significant savings found," it now shows: a green "You're spending well" hero message, a one-line reason per tool (e.g., "Cursor Pro is correctly sized for your 1 developer"), and a "Notify me when new optimisations apply to your stack" email capture CTA. The email capture rate on optimal-spender audits was previously near-zero because the page felt useless; this framing gave them a reason to leave their email.
