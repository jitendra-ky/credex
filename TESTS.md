# TESTS.md

## Overview

All tests are located in `src/features/audit/__tests__/` and `src/features/leads/services/__tests__/`. Run with Jest.

```bash
npm test                  # Run all tests
npm run test:coverage     # With coverage report
```

CI runs `npm run test:coverage` on every push to `main` via `.github/workflows/ci.yml`.

---

## Audit Engine Tests

### `AuditRuleEngine.test.ts`

**File:** `src/features/audit/__tests__/AuditRuleEngine.test.ts`  
**What it covers:** The central rule orchestrator — aggregation, sorting, tagging, error isolation, precision.

| Test | What it verifies |
|---|---|
| Execute all rules and aggregate findings | Multi-rule execution produces correct `total_monthly_savings_usd` and `total_annual_savings_usd` |
| Sort findings by severity then savings | Critical findings appear before warnings; within same severity, higher savings appear first |
| Tag `high-savings` when savings > $500/mo | `audit_tag` is `"high-savings"` for $501/mo |
| Tag `medium` when savings $100–$500/mo | `audit_tag` is `"medium"` for $250/mo |
| Tag `optimal` when savings < $100/mo | `audit_tag` is `"optimal"` for $50/mo |
| Generate unique audit IDs | Two consecutive executions produce different UUID v4 strings |
| Handle rule execution errors gracefully | Failing rule is skipped; healthy rules still produce findings |
| Round aggregate savings to 2 decimal places | `$123.456789/mo` aggregates to `$123.46` |
| Include `created_at` timestamp | Timestamp is within `beforeExecution`–`afterExecution` range |

---

### `TypeIDefectRules.test.ts`

**File:** `src/features/audit/__tests__/TypeIDefectRules.test.ts`  
**What it covers:** Over-provisioning and minimum seat trap rules (Type I).

| Test | Rule | What it verifies |
|---|---|---|
| Returns finding for Claude Team < 5 seats | `RULE_1_1` | 3-seat Team plan flags ghost seat cost |
| Returns no finding for Claude Team >= 5 seats | `RULE_1_1` | 5-seat Team plan passes |
| Saves $25/ghost seat on team_standard | `RULE_1_1` | Correct savings math for standard plan |
| Saves $125/ghost seat on team_premium | `RULE_1_1` | Correct savings math for premium plan |
| Flags ChatGPT Business with 1 seat | `RULE_1_2` | 1-seat Business plan flags $25/mo waste |
| Skips ChatGPT Business 2+ seats | `RULE_1_2` | 2-seat Business is valid |
| Annual billing discount for Cursor monthly | `RULE_1_3` | Monthly Cursor user gets ~20% annual savings recommendation |
| Skips annual billing for already-annual tools | `RULE_1_3` | Annual billing users are not double-flagged |

---

### `TypeIIDefectRules.test.ts`

**File:** `src/features/audit/__tests__/TypeIIDefectRules.test.ts`  
**What it covers:** Feature mismatch and identity management taxation (Type II).

| Test | Rule | What it verifies |
|---|---|---|
| Flags Cursor Enterprise when SAML-only required | `RULE_2_1` | Enterprise SCIM tax identified when SAML suffices |
| Skips when SCIM is actually required | `RULE_2_1` | Legitimate SCIM use case not flagged |
| Flags v0 Business without privacy requirement | `RULE_2_2` | v0 Business at $100/user flagged when `strict_data_privacy` is false |
| Skips v0 Business when privacy required | `RULE_2_2` | Legitimate privacy requirement not flagged |
| Flags v0 Team without Vercel Pro infrastructure | `RULE_2_3` | Hidden $20/user infrastructure requisite exposed |
| Skips v0 Team when Vercel Pro active | `RULE_2_3` | Justified infrastructure spend not flagged |

---

### `TypeIIIDefectRules.test.ts`

**File:** `src/features/audit/__tests__/TypeIIIDefectRules.test.ts`  
**What it covers:** API usage inefficiency and consumption arbitrage (Type III).

| Test | Rule | What it verifies |
|---|---|---|
| Flags Anthropic API async + high volume | `RULE_3_1` | 50% batch API discount flagged for qualifying workloads |
| Skips Anthropic API real-time workloads | `RULE_3_1` | Synchronous workloads not flagged |
| Flags OpenAI API async + high volume | `RULE_3_1` | Same 50% discount for OpenAI Batch API |
| Skips low-volume async workloads | `RULE_3_1` | Sub-10M token volumes not flagged (not worth migration cost) |
| Flags Claude Enterprise > 150 seats | `RULE_3_2` | Informational finding about variable cost risk |
| Flags ChatGPT Go tier for non-research use | `RULE_3_3` | Go tier flagged as productivity loss for coders/writers |
| Skips ChatGPT Go tier for research use | `RULE_3_3` | Research use case not flagged |

---

### `TypeIVDefectRules.test.ts`

**File:** `src/features/audit/__tests__/TypeIVDefectRules.test.ts`  
**What it covers:** Stack consolidation and functional redundancy (Type IV).

| Test | Rule | What it verifies |
|---|---|---|
| Flags ChatGPT + Claude + Gemini same cohort | `RULE_4_1` | Triplet redundancy flagged with correct redundancy cost |
| Skips when only 2 platforms active | `RULE_4_1` | Two general-purpose tools is reasonable |
| Skips when seat counts differ > 15% | `RULE_4_1` | Different cohort sizes indicate intentional use |
| Flags ChatGPT Pro tier + multi-seat simultaneously | `RULE_4_2` | Individual power user tier + team licensing flagged |
| Flags Claude Max tier + multi-seat simultaneously | `RULE_4_2` | Same pattern for Claude Max plans |

---

### `TypeVDefectRules.test.ts`

**File:** `src/features/audit/__tests__/TypeVDefectRules.test.ts`  
**What it covers:** GitHub Copilot-specific overspend patterns (Type V).

| Test | Rule | What it verifies |
|---|---|---|
| Flags Copilot Enterprise without SCIM need | `RULE_5_1` | $39→$19/user downgrade identified ($20/user savings) |
| Skips Copilot Enterprise with SCIM required | `RULE_5_1` | Legitimate Enterprise use case not flagged |
| Flags Cursor + Copilot same-cohort overlap | `RULE_5_2` | IDE AI redundancy flagged; cheaper tool identified as keep |
| Skips Cursor + Copilot different-cohort | `RULE_5_2` | Seat variance > 20% not flagged |
| Flags Copilot Pro+ with multiple seats | `RULE_5_3` | Multi-seat Pro+ identified as misuse vs Business plan |
| Skips Copilot Pro+ for single user | `RULE_5_3` | Legitimate individual power user not flagged |

---

### `AuditService.test.ts`

**File:** `src/features/audit/__tests__/AuditService.test.ts`  
**What it covers:** Service layer — orchestration of engine, summary generation, and DB persistence.

| Test | What it verifies |
|---|---|
| Full audit flow with valid input | Engine + summary + DB persist path with mocked dependencies |
| Summary fallback on Gemini API failure | Graceful degradation when `GEMINI_API_KEY` absent |
| Returns correct audit result shape | All required fields present in response |

---

### `AuditIntegration.test.ts`

**File:** `src/features/audit/__tests__/AuditIntegration.test.ts`  
**What it covers:** HTTP endpoint integration — `POST /api/audit` request/response lifecycle.

| Test | What it verifies |
|---|---|
| POST /api/audit returns 200 with valid body | Full request lifecycle with mocked DB and Gemini |
| POST /api/audit returns 400 on invalid input | Zod validation rejects malformed request |
| POST /api/audit returns 500 on DB failure | Service error surfaced correctly as 500 |
| GET /api/audits/[id] returns 404 on missing audit | Not-found handling |
| GET /api/audits/[id] returns 200 with audit data | Persisted audit retrieval |

---

## Lead Capture Tests

### `LeadService.test.ts`

**File:** `src/features/leads/services/__tests__/LeadService.test.ts`  
**What it covers:** Lead capture orchestration — validation, rate limiting, DB upsert, email notification.

| Test | What it verifies |
|---|---|
| Captures new lead successfully | Full happy path: validates → rate-limit passes → DB upsert → email fires |
| Returns `is_new: false` for duplicate email | Upsert logic returns existing lead without error |
| Throws `RateLimitError` on 5+ leads from same IP in 15 min | IP-based rate limit enforced |
| Continues when email service throws | Email failure does not block lead capture (fire-and-forget) |
| Stores correct IP address | IP extracted from request and stored on lead record |
| Validates email format | Invalid email format rejected with `VALIDATION_ERROR` |
| Handles null optional fields | `company_name` and `role` nullable without crashing |
| Upserts by email, not audit_id | Same email + different audit_id returns existing lead |
| `audit_id` linked on lead record | Lead record stores the originating audit UUID |

---

## How to Run Individual Test Files

```bash
# Run a specific test file
npx jest TypeVDefectRules.test.ts

# Run all rule tests
npx jest --testPathPattern="DefectRules"

# Run with verbose output
npx jest --verbose

# Run and watch for changes
npm run test:watch
```

---

## Coverage Summary

| Module | Statements | Branches | Functions |
|---|---|---|---|
| Audit Engine | ~95% | ~90% | 100% |
| Audit Rules (all types) | ~92% | ~88% | 100% |
| Lead Services | ~90% | ~85% | 100% |
| API Routes (mocked) | ~80% | ~75% | 100% |

> Run `npm run test:coverage` to see the full coverage report in `coverage/lcov-report/index.html`.
