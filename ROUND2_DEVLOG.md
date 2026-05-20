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
