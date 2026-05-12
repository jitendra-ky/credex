# REFLECTION.md

## 1. The Hardest Bug I Hit This Week

The most painful bug was the Open Graph image endpoint crashing on production with a `Cannot use import statement` error — only on the deployed Vercel instance, never locally.

Here's how I debugged it. The OG route (`/api/og`) was generating dynamic images for shared audits. It worked perfectly in dev (`npm run dev`) but crashed on Vercel Edge Runtime. My first hypothesis was a missing `@vercel/og` import — wrong, the import was fine. Second hypothesis: one of the transitive imports was pulling in a Node.js-only module. I added `export const runtime = 'edge'` to the route, thinking that was the correct path, and the crash changed from a module error to a `pg is not defined` error. That was the breakthrough clue.

The `pg` library (PostgreSQL client) uses Node.js-specific APIs (`net`, `tls`, `fs`) that don't exist in the V8 Isolate / Edge Runtime environment. The OG route was importing from a shared DB module at the top of the file, which transitively pulled in `pg`. Even though the OG route only needs the audit data (not a DB connection of its own), it was dragging in the entire Postgres client.

I considered three fixes: (1) lazy-load the DB import inside the handler function, (2) restructure the OG route to accept data via query params instead of reading from DB, (3) switch to Node.js runtime for this route. Option 2 was cleanest — it decoupled the OG route from the DB entirely, made it stateless and cacheable, and pushed the DB read responsibility to the client that calls it. Implemented it, tests passed, Vercel deploy went green. The key lesson: Edge Runtime restrictions make you write genuinely more modular code; the constraint was actually good architecture pressure.

---

## 2. A Decision I Reversed Mid-Week

My original share flow used randomly generated 8-character alphanumeric share codes (e.g., `xK7mP2qR`). The idea was that a shorter code looked cleaner in a shared URL than a full UUID. I built the share code generator, a separate lookup route (`GET /api/share/[code]`), and a DB column to store the code alongside the audit UUID.

I reversed this decision on Day 6 when I stepped back and asked: "what problem does the share code actually solve?" The UUID is already 36 characters of unguessable randomness — exactly what a share code provides. The share code added a second layer of indirection with no actual benefit: two columns in the DB, two API routes, two code paths to maintain, and two things that could be out of sync if a migration failed.

What made me reverse it was noticing that the share code lookup route had to join against the audits table anyway to retrieve the audit data. So every share page load was doing: lookup share code → get audit UUID → fetch audit by UUID. That's two queries where one suffices. I deleted the share code generator, the lookup route, the DB column, and replaced the whole thing with a simple `is_shared: boolean` flag on the audit row. The UUID already in the URL is the identifier. Less code, one query, and the sharing logic now fits in a single paragraph of the architecture doc. The PR was `7440991`.

---

## 3. What I Would Build in Week 2

Week 2 would be about making the audit engine substantially more defensible and making the product loop viral.

**Priority 1 — Benchmark mode.** The audit currently tells you "you're overspending." It doesn't tell you how much relative to peers. I'd build a benchmark comparison: "Your AI spend per developer is $X/mo. Startups at your stage average $Y/mo." This requires aggregating anonymised data across audits (with consent), but even a hand-curated benchmark dataset based on public pricing × typical seat counts would be more compelling than the current absolute figures.

**Priority 2 — PDF export.** The results page is beautiful on screen, but the most natural thing a CTO does after an audit is forward it to their CFO or put it in a budget review doc. A one-click PDF export of the full report (with Credex branding) is the highest-leverage conversion feature I'd add. It also extends the viral loop — the PDF has a QR code linking to the live shared audit URL.

**Priority 3 — Email drip sequence.** Currently the lead is captured and a single confirmation email fires. Week 2 would add a 3-email drip over 7 days: Day 1 (confirmation + audit summary), Day 4 ("here's what others in your industry saved this week"), Day 7 ("Credex can get you these credits at X% off — book a call"). This is where the lead-gen economics actually close.

**Priority 4 — Embeddable widget.** A `<script>` tag that blog authors and newsletter writers can drop in to let readers run a quick mini-audit inline. Lower friction than clicking through to a new site, and massively increases top-of-funnel exposure.

---

## 4. How I Used AI Tools

**Tools used:** Claude Sonnet 4.5 (via Antigravity / Cursor), GitHub Copilot inline completion.

**What I used them for:**
- Generating boilerplate TypeScript interfaces and Zod schemas once I had the shape worked out on paper
- Writing Jest test fixtures — describing what the test should cover in plain English and having Copilot scaffold the `describe`/`it` blocks
- Debugging — pasting error traces and asking for hypothesis lists
- Reviewing my rule logic for edge cases I hadn't considered (e.g., "what happens if seats is 0 in the SCIM tax rule?")

**What I didn't trust them with:**
- The pricing numbers in `PRICING_DATA.md` — every number was hand-verified against the vendor's official pricing page and date-stamped
- The audit rule logic itself — the rules encode specific financial reasoning that needed to be defensible; I wrote all rule implementations myself and used AI only to check for logical errors after the fact
- Architecture decisions — I sketched the system diagram on paper before writing any code
- The REFLECTION and GTM documents — these needed to reflect genuine thinking, not templated responses

**One specific time the AI was wrong and I caught it:**

When implementing the `ChatGPTGoTierProductivityLossRule`, I asked Claude to suggest what the monthly savings should be for a Go-tier user upgrading to Plus. It suggested `$20 - $8 = $12` per user. That's arithmetically correct. But I caught that this rule is framed as a *savings* opportunity, when really it's an *upgrade recommendation* — the user spends more money (Go → Plus costs more), but gets more value. The savings number should represent the productivity cost of staying on Go, not the spend delta. I flagged this as informational (low monthly savings figure) rather than a hard cost reduction, which is more honest. The AI didn't have enough domain context to catch the frame mismatch.

---

## 5. Self-Rating

| Dimension | Score | Reason |
|---|---|---|
| **Discipline** | 7/10 | 7 distinct calendar days of commits, DEVLOG maintained daily, but a couple of entries were written at end-of-day rather than real-time. Commits on Days 1–3 were lighter than I'd have liked. |
| **Code quality** | 8/10 | TypeScript strict mode, Zod validation at all API boundaries, SOLID principles throughout the audit rules (each rule is a class with single responsibility), full test coverage on the engine. Small debt: `model: any` in `SummaryGenerationService` should be typed. |
| **Design sense** | 7/10 | The results page is polished and the savings hero number reads well. The multi-step form works correctly but could use smoother transitions and better mobile responsiveness. Lighthouse accessibility score was 90+ on desktop, mobile needs another pass. |
| **Problem-solving** | 8/10 | The OG/Edge runtime bug took about 2 hours to fully diagnose and fix — longer than ideal, but I formed clear hypotheses and systematically eliminated them rather than guessing. The share-code reversal shows willingness to delete code when the reasoning doesn't hold. |
| **Entrepreneurial thinking** | 7/10 | I understand the product's role in the Credex funnel and designed the audit results page to drive the right conversions (Credex CTA at >$500/mo, honest "you're spending well" at <$100). The GTM and economics docs reflect real thinking. The user interviews section is the area I'm least satisfied with — the conversations were real but happened under time pressure. |
