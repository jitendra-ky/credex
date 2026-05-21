## 2026-05-20 11:00 - Start
Read the assignment line by line, and think how would I build this feature.

## 2026-05-20 12:00 - Understand Problems While Building Requested Feature

**Current Flow:**
- User visits website → fills AI tool form → audit generated → user sees it → lead form appears

**Identified Issues:**
1. Database schema doesn't persist user input form data (only audit reports were saved)
2. Email sending is currently a mock feature (prints to terminal) - needs real email engine

**Key Challenge: "Re-audit on Pricing Change" Feature**
The main challenge is implementing an "AI tool pricing change detection system". Explored multiple possible solutions:

### Solution 1: Fully Automated Price Scraping
Set up a service that periodically scrapes AI tool pricing from official websites.

**Advantages:** Straightforward implementation given prior experience

**Problems Identified:**
- Price changes alone are manageable, but many AI tools don't just update prices—they add/remove plans or change conditions
- Automating detection of new plans and plan structure changes is complex and error-prone
- Each edge case requires new logic, increasing script complexity and bug risk
- **Decision:** Dropped this solution due to maintenance burden and quality concerns

## 2026-05-20 13:00 - Continued Exploring Pricing Change Detection Solution

### Solution 2: Admin Portal for Manual Price Updates
Create an admin dashboard where admins manually update pricing information.

**Critical Flaw in This Approach:**
Audit reports depend on three factors:
- User input
- AI tool prices
- Audit engine rules

Rather than `audit_engine(ai_tool_prices, user_input)`, the proper architecture is `audit_engine(user_input)` with prices deeply linked to rules.

**Example of Why This Fails:**
- If ChatGPT Pro price increases from $100→$500: admin portal works fine
- If ChatGPT adds a new plan or changes plan conditions: creating an admin interface to handle all possible pricing variations is unrealistic and unmaintainable

**Decision:** Dropped this solution

### Solution 3: Update Audit Engine Rules in Codebase (Chosen Approach)
- When AI tool pricing changes, manually update audit engine rules in the codebase
- Commit changes to trigger GitHub Actions
- Add audit engine version numbering: version increments on any rule change → triggers workflow automatically
- Workflow orchestrates all downstream work (re-audits, notifications, etc.)

**Remaining Challenge:**
When submitting the solution, the Credex team needs to make commits to the main branch to test changes. They may lack repository permissions, which could cause submission rejection.

**Mitigation:** Provide an alternate testing mechanism (TBD)

## work on it until 2026-05-20 14:00.

## 2026-05-20 23:00 - Update the devlogs.

## 2026-05-21 02:00 - Designing Database Schema

Started designing what new tables are needed. Constraint: no changes to existing `auditsTable` or `leadsTable`.

**Identified gaps in current schema:**
1. `auditsTable` has no `email` field — can't email users about stale audits
2. No way to track which engine version produced an audit
3. No way to mark an audit as stale when rules change
4. `leadsTable.email` has a UNIQUE constraint — one email = one row = one `audit_id`. Can't support multiple audits per user.

**First attempt — too complex:**
Proposed three tables: `pricing_versions` (storing pricing JSON), `stored_audits`, `reaudit_notifications`. Then realised `pricing_versions` is wrong — pricing isn't a separate data store, it's baked into the rule code. A "pricing change" means a rule change in the codebase, not a DB row. Dropped `pricing_versions`.

**Second attempt — questioned `stored_audits` email field:**
`stored_audits` had an `email` column. Questioned whether it's redundant since `leadsTable` already has email linked via `audit_id`. Conclusion: NOT redundant — `leadsTable` only stores the latest `audit_id` per email (upsert + unique constraint). System-generated re-run audits never create a new lead row, so reverse-lookup of email from a re-run `audit_id` through `leadsTable` is impossible.

**Third attempt — questioned `stored_audits` entirely:**
If `leadsTable` already links email → audit, why have `stored_audits` at all? Answer: the existing relationship is one lead → one audit (not one-to-many). `leadsTable.audit_id` gets overwritten on each upsert. Round 2 requires one lead → many audits across versions.

**Final decision — rename and clarify:**
`stored_audits` is really just the missing one-to-many relationship table between leads and audits. Renamed to `lead_audits` to make that clear. Email comes from `lead_id → leadsTable.email`, no duplication.

**Final schema — 2 new tables only:**

`lead_audits`: proper one-to-many join (lead_id → audit_id), tracks engine_version, is_stale, previous_audit_id for diff view.

`reaudit_notifications`: one row per user per engine version change, prevents duplicate emails.

## 2026-05-21 14:00 — Lead Capture: OTP Email Verification

**Backend:**
- `email_verifications` table (10-min OTP expiry, 5-min send cooldown, 3 max attempts)
- `OtpService`: `sendOtp(email)` + `verifyOtp(email, code)` state machine
- `EmailService`: strategy pattern (MockEmailProvider default, ResendEmailProvider for production)
- `POST /api/leads/send-otp` + `POST /api/leads/verify-otp` endpoints
- 5 error classes + 2 Zod schemas

**Frontend:**
- 3-step `LeadCaptureModal` (details → OTP → success)
- 6-digit OTP input with paste support, countdown timer, error messages
- `localStorage` flag prevents re-showing after capture
- Fixed modal import bug in `page.tsx`

## 2026-05-21 16:30 - setup reset email sending service

- As sending email is a valuable part of round 2 so I send a good amount of time setting of a reach email sencing service.
- a Mock email sending service was setup in round 1.
- I choose to use "resend.com" email sending service due to two main reason it is free and easy to implement.
- setup my own gmail for sending email too look profession i.e. (credex@jitendraky.tech)

## 2026-05-21 18:00 — Planning the re-audit pipeline architecture

Started designing how the engine version bump actually triggers re-audits end-to-end.

**Key architectural question:** where does the trigger live?
- First instinct was a `POST /api/detect-changes` endpoint that GitHub Actions calls via curl.
- Rejected this — adds an unnecessary HTTP layer and requires a secret token just to call our own server. Simpler to run the logic directly inside the GH Actions runner.
- **Decision:** standalone `scripts/run-reaudit.ts` executed via `npx tsx`, with `DATABASE_URL` and `RESEND_API_KEY` injected as GitHub repo secrets. No endpoint needed.

**Trigger file strategy:**
GitHub Actions `paths` filter on `src/features/audit/engine/version.ts` only. Bumping that one file is the single action that kicks off the entire pipeline. Nothing else triggers it.

**Stale detection logic:**
- For each lead, find their most recent `lead_audits` row (latest `created_at`).
- If that row's `engine_version` differs from `AUDIT_ENGINE_VERSION` → stale.
- Re-run only that lead's latest audit, not all historical ones.
- Compare: if `total_monthly_savings_usd` or `audit_tag` changed → persist. Otherwise discard.

## 2026-05-21 18:30 — Implementing the re-audit system

Built all 6 components of the system:

1. `src/features/audit/engine/version.ts` — `AUDIT_ENGINE_VERSION = '1.0.0'` constant.
2. `src/lib/db/queries.ts` — 5 new functions: `createLeadAudit`, `getLatestLeadAuditPerLead`, `markLeadAuditStale`, `createReauditNotification`, `updateNotificationStatus`.
3. `src/features/leads/services/LeadService.ts` — calls `createLeadAudit` after `upsertLead` so every lead has a `lead_audits` entry from the start.
4. `src/features/leads/services/EmailService.ts` — added `sendReauditNotification()` to both Mock and Resend providers. Email includes savings delta and a one-click re-run link to `/audit/[oldAuditId]?rerun=true`.
5. `scripts/run-reaudit.ts` — the full pipeline script.
6. `.github/workflows/reaudit.yml` — triggers on `version.ts` change on `main`, runs script directly.

TypeScript type-check passed with zero errors after implementation.

## 2026-05-21 19:00 — Design correction on lead_audits write responsibility

Caught an architectural issue after review: I was writing to `lead_audits` inside `LeadService.captureLead()` on every lead form submission. This is wrong.

**The problem:** `lead_audits` is designed to track the *re-audit history* for a lead — one row per engine version bump. Writing to it on initial capture couples the initial flow to the re-audit system and blurs the table's single responsibility.

**Correct design:**
- `leadsTable.audit_id` = the original audit. Written by `/api/leads` as always.
- `lead_audits` = written exclusively by `scripts/run-reaudit.ts` when an engine version bump produces a changed result.
- The script detects staleness by querying `leadsTable` for leads that have no `lead_audits` row for the current version yet (NOT EXISTS pattern), not by reading from `lead_audits` directly.

This keeps `lead_audits` as a pure re-audit history table and `leadsTable` behavior completely unchanged.

## 2026-05-21 19:30 — Diff view complete and verified

`AuditDiffView.tsx` is done. Reviewed the full rendering path: `page.tsx` reads `?rerun=true`, calls `getNewAuditByPreviousAuditId(oldAuditId)`, fetches both audit records, derives engine versions, passes all four props into `AuditDiffView`. The component covers all four row states (changed / new / removed / unchanged), collapses unchanged rows with a chevron, and shows the total annual savings delta as the headline. TypeScript is clean.

One edge case handled: if the re-audit script hasn't run yet when the user clicks the email link (race condition — they click very fast, or the GH Actions job is slow), the page shows the original audit with a "Pricing Update Being Processed" amber banner instead of 404-ing. That's a much better UX than a blank error.

## 2026-05-21 20:00 — Gap analysis: email content is thin

Re-read the Round 2 spec carefully. Realized the notification email only shows a savings delta number and audit tag — the spec explicitly requires "what changed (which tools, which prices)." The diff view covers this on the re-run page, but the email itself doesn't name the tools.

Decision: enrich the email. The `run-reaudit.ts` script already has `oldResult.findings` and `newResult.findings` in scope. Plan: compute changed tool names in the script, pass them into `EmailService.sendReauditNotification()` as an additional `changedTools: string[]` argument, render as a bullet list in the HTML email.

Risk: this touches the `IEmailProvider` interface, both `MockEmailProvider` and `ResendEmailProvider`, the public `EmailService` facade, and the call site in `run-reaudit.ts`. Need to be careful not to break OTP or confirmation email paths — they don't use `sendReauditNotification()` so the interface change is additive only.

## 2026-05-21 20:30 — Email enrichment shipped

Updated `EmailService.ts`: added `changedTools: string[]` as a fourth parameter to `sendReauditNotification()` on the interface, both providers, and the facade. Mock provider logs the tool list. Resend provider renders an `<ul>` in the HTML body showing each changed tool name. Ran `npx tsc --noEmit` — zero errors.

Updated `run-reaudit.ts`: added `computeChangedTools(oldResult, newResult)` helper that diffs the findings arrays by `tool_name` (presence, absence, and savings change ≥ $1/mo threshold) and returns a display-ready string array. Passed the result into `emailService.sendReauditNotification()`. All other script logic untouched.

## 2026-05-21 21:00 — Writing submission documents

Wrote `ROUND2_PR.md` (~700 words). Structured exactly as spec requires: What this PR does / Why / How it works (with ASCII data-flow diagram) / What I cut (5 bullets with honest reasoning) / How to test it manually (two options: GH Actions path and direct script path) / What's tested.

Wrote `ROUND2_REFLECTION.md`. Three questions answered at ~150 words each. Made the answers specific — named the actual trade-off (thin email vs. rich diff view), named the actual first thing I'd fix (per-tool email breakdown), named the actual Round 1 decision that caused friction (unique audit_id on leadsTable).

## 2026-05-21 21:15 — Final check

All four required features working. Three required files at repo root: `ROUND2_PR.md`, `ROUND2_DEVLOG.md`, `ROUND2_REFLECTION.md`. Branch is `round-2-reaudit`. Commit history is within the 36h window with conventional commit messages. Done.