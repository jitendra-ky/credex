# Round 2 Reflection

---

## 1. What was the most uncomfortable trade-off you made because of the time pressure? Be specific — name the trade-off, not the feeling.

The trade-off was between making the notification email genuinely informative and shipping the diff view on time.

The spec says the email must include "what changed (which tools, which prices)." My first instinct was to build a proper per-tool delta section in the email — a bullet list like "Cursor: was $19/seat → now $25/seat, saving delta: -$72/mo." That requires passing both old and new `findings` arrays into the email renderer and diffing them there, separate from the diff view logic. I started doing it, then stopped.

The uncomfortable part: I knew the email as shipped is thin. It shows a savings delta number and a new audit tag. That's technically sufficient to tell the user something changed, but it doesn't show *which* tool changed or *by how much* per tool. I made the deliberate call to spend the time instead on the diff view — which is richer, interactive, and permanent — and let the email be a prompt to click through, not a self-contained answer. The email is the hook; the diff view is the substance.

That trade-off is defensible architecturally. It was still uncomfortable to knowingly ship something that doesn't fully satisfy the stated requirement, even with a clear reason.

---

## 2. If we extended the deadline by another 24 hours right now, what's the first thing you'd do?

Enrich the notification email with a per-tool diff. Not the unsubscribe link, not the admin dashboard — specifically the email content.

The `run-reaudit.ts` script already has both `oldResult.findings` and `newResult.findings` in scope when it calls `sendReauditNotification()`. The `diffUtils.ts` module already has `computeAuditDiff()`. The work is: extract the changed tool names from the diff, pass them into `EmailService.sendReauditNotification()` as an additional argument, and render them as a bullet list in the HTML template.

This is the one remaining gap between what I shipped and what the spec literally asks for. It's also the gap that a real user would notice first — the email that says "your audit changed, +$30/mo" is less useful than the email that says "Cursor pricing changed: your team of 8 is now paying $200/mo more than necessary, here's why." Everything else (diff view, dedup, persistence) is working. This is the last piece.

---

## 3. Looking back at your Round 1 codebase as a now-experienced user of it: what's one thing your Round 1 self made harder for your Round 2 self?

The `leadsTable.email` unique constraint with `audit_id` stored directly on the row.

Round 1's model was: one email = one lead = one audit. That was fine for Round 1. Round 2 needs one email = one lead = many audits across engine versions. The unique constraint on `email` meant every new lead capture overwrites the previous `audit_id` (upsert logic). So the `leads` table was already losing historical data by design before Round 2 even existed.

The fix — the `lead_audits` join table — is the right architectural response, but it took real time to reason through. I had to decide whether `lead_audits` should be written during initial lead capture (wrong — it's for re-audit history), where `email` comes from when the re-audit script runs (from `leadsTable` via join, not duplicated on `lead_audits`), and why `leadsTable.audit_id` is now deprecated. Each of those decisions was correct, but they were all forced by a schema choice in Round 1 that assumed one-to-one. If Round 1 had stored audits in a separate join table from the start — or at least left `audit_id` off `leadsTable` entirely — Round 2's schema would have been cleaner and faster to design.

The general lesson: when you model a "latest X for Y" relationship by putting a foreign key on Y, you've already decided you don't care about history. That's fine until you do care about history.
