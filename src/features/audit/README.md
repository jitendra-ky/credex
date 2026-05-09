# AI Spend Audit Engine - Business Logic

## Overview

The AI Spend Audit Engine is a **deterministic, rule-based system** that analyzes organizational artificial intelligence software expenditure and identifies financial optimization opportunities across 12 specialized audit rules grouped into 4 defect categories.

**Core Principle**: The audit engine applies strict, mathematically verifiable boolean logic to detect:
1. Over-provisioning and seat minimum violations
2. Feature mismatch and identity management taxation
3. Usage inefficiency and consumption arbitrage
4. Stack consolidation and functional redundancy

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AuditService (Facade)                      │
│  - Input validation                                             │
│  - Orchestrates entire audit flow                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AuditRuleEngine (Orchestrator)                │
│  - Executes all 12 rules in sequence                           │
│  - Aggregates findings by severity & savings                   │
│  - Determines audit tag (high-savings | medium | optimal)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Type I     │ │  Type II     │ │  Type III    │
    │  Rules      │ │  Rules       │ │  Rules       │
    │ (3 rules)   │ │ (3 rules)    │ │ (4 rules)    │
    └─────────────┘ └──────────────┘ └──────────────┘
          │              │                    │
          └──────────────┼────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼
    ┌─────────────┐ ┌──────────────┐
    │  Type IV    │ │ All Rules    │
    │  Rules      │ │ Implement    │
    │ (2 rules)   │ │ IAuditRule   │
    └─────────────┘ └──────────────┘
```

### SOLID Principles

- **Single Responsibility**: Each rule class detects exactly one defect pattern
- **Open/Closed**: New rules can be added without modifying existing code
- **Liskov Substitution**: All rules implement `IAuditRule` interface
- **Interface Segregation**: `IAuditRule` contains only `execute()` method
- **Dependency Inversion**: `AuditRuleEngine` depends on `IAuditRule` abstraction, not concrete rules

---

## Audit Rules (12 Total)

### Type I: Over-Provisioning & Seat Minimum Violations

| Rule ID | Rule Name | Detection Logic | Example Savings |
|---------|-----------|-----------------|-----------------|
| `1.1` | Claude Team Minimum | Team plan enforced 5-seat minimum with <5 users | $50/mo for 3-user team |
| `1.2` | ChatGPT Business Minimum | Business plan enforced 2-seat minimum with 1 user | $25/mo for solo user |
| `1.3` | Annual Billing Arbitrage | Monthly billing when annual discount available (~20%) | $20/mo per tool (annualized) |

### Type II: Feature Mismatch & Identity Taxation

| Rule ID | Rule Name | Detection Logic | Example Savings |
|---------|-----------|-----------------|-----------------|
| `2.1` | Enterprise SCIM Tax | Enterprise tier active when SAML SSO sufficient | $400+/mo per tool |
| `2.2` | v0 Privacy Tax | v0 Business ($100/mo) active when training opt-out not required | $80/user/mo |
| `2.3` | v0 Infrastructure Trap | v0 Team without active Vercel Pro (hidden $20/mo tax) | $300/mo for 10-user team |

### Type III: Usage Inefficiency & Consumption Arbitrage

| Rule ID | Rule Name | Detection Logic | Example Savings |
|---------|-----------|-----------------|-----------------|
| `3.1` | Batch API Arbitrage | Async workload >10M tokens without Batch API optimization | 50% of API spend |
| `3.2` | Claude Enterprise API Trap | Enterprise plan >150 seats with variable costs (informational) | Context-dependent |
| `3.3` | ChatGPT Go Tier Loss | "Go" tier ($8/mo) for knowledge workers who need frontier models | $12/user upgrade cost |
| `3.4` | Regional Residency Tax | US-only data residency enforcement (10% uplift, informational) | N/A (compliance cost) |

### Type IV: Stack Consolidation & Redundancy

| Rule ID | Rule Name | Detection Logic | Example Savings |
|---------|-----------|-----------------|-----------------|
| `4.1` | Chatbot Redundancy | 2+ general-purpose LLMs (ChatGPT + Claude + Gemini) in same cohort | $400+/mo consolidation |
| `4.2` | Extreme Power User | Individual Max/Pro tier + team tier simultaneously (unlikely to saturate both) | $100-$300/mo |

---

## Input Data Structure

### AuditRequest Schema

```typescript
{
  global_context: {
    total_team_size: number,
    primary_use_case: "coding" | "writing" | "data_analysis" | "research" | "mixed_general",
    security_requirements: {
      saml_sso_required: boolean,
      scim_automated_provisioning_required: boolean,
      strict_data_privacy_no_training_required: boolean
    }
  },
  current_stack: {
    cursor: { is_active, current_plan, number_of_seats, billing_cycle, current_monthly_spend_usd },
    claude_gui: { is_active, current_plan, number_of_seats, billing_cycle, current_monthly_spend_usd },
    chatgpt_gui: { is_active, current_plan, number_of_seats, billing_cycle, current_monthly_spend_usd },
    gemini: { is_active, current_plan, number_of_seats, billing_cycle, current_monthly_spend_usd },
    v0_vercel: { is_active, current_plan, number_of_seats, has_vercel_pro_infrastructure_active, current_monthly_spend_usd },
    anthropic_api: { is_active, primary_model_used, average_monthly_token_volume_millions, is_workload_asynchronous, requires_us_data_residency, current_monthly_spend_usd },
    openai_api: { is_active, primary_model_used, average_monthly_token_volume_millions, is_workload_asynchronous, requires_us_data_residency, current_monthly_spend_usd }
  }
}
```

---

## Output Data Structure (DB-Ready)

### AuditResult Schema

```typescript
{
  audit_id: "uuid-v4",
  findings: [
    {
      id: "unique-finding-id",
      tool_name: "Claude GUI" | "ChatGPT GUI" | "Cursor" | ...,
      rule_id: "RULE_1_1_CLAUDE_TEAM_MINIMUM",
      severity: "critical" | "warning" | "info",
      title: "Human-readable issue title",
      description: "Detailed explanation of the issue",
      recommendation: "Specific action to resolve",
      monthly_savings_usd: 123.45,
      annual_savings_usd: 1481.40
    }
  ],
  total_monthly_savings_usd: 1234.56,
  total_annual_savings_usd: 14814.72,
  audit_tag: "high-savings" | "medium" | "optimal",
  created_at: Date
}
```

### Severity Levels

- **Critical**: Monthly savings >$500 (immediate action recommended)
- **Warning**: Monthly savings $100-$500 (moderate optimization opportunity)
- **Info**: Monthly savings <$100 OR informational compliance costs (nice-to-have optimization)

### Audit Tags

- **`high-savings`**: Total monthly savings >$500 (strong consolidation/optimization case)
- **`medium`**: Total monthly savings $100-$500 (moderate optimization opportunity)
- **`optimal`**: Total monthly savings <$100 (stack already well-optimized)

---

## Usage Examples

### Basic Usage

```typescript
import { AuditService } from '@/features/audit';

const auditService = new AuditService();

const request = {
  global_context: {
    total_team_size: 10,
    primary_use_case: 'coding',
    security_requirements: {
      saml_sso_required: false,
      scim_automated_provisioning_required: false,
      strict_data_privacy_no_training_required: false
    }
  },
  current_stack: {
    // ... tool configurations
  }
};

const result = await auditService.executeAudit(request);

// result is ready for DB insertion
const auditRecord = {
  id: result.audit_id,
  tools_json: request,
  results_json: result,
  summary: null, // Populated later by LLM service
  tag: result.audit_tag,
  created_at: result.created_at,
  updated_at: new Date()
};

// Insert into audits table
await db.insert(audits).values(auditRecord);
```

### In API Route (Next.js)

```typescript
// src/app/api/audit/route.ts
import { AuditService } from '@/features/audit';
import { AuditRequest } from '@/features/audit/types/audit.types';

export async function POST(request: Request) {
  const auditRequest: AuditRequest = await request.json();

  const auditService = new AuditService();

  try {
    const auditResult = await auditService.executeAudit(auditRequest);

    // TODO: Persist to DB
    // TODO: Call LLM service for summary
    // TODO: Return audit result

    return Response.json(auditResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

---

## Testing

All business logic includes comprehensive Jest unit tests:

```bash
npm test -- src/features/audit/__tests__
```

### Test Files

- `TypeIDefectRules.test.ts` - Over-provisioning rules
- `TypeIIDefectRules.test.ts` - Feature mismatch rules
- `TypeIIIDefectRules.test.ts` - Usage inefficiency rules
- `TypeIVDefectRules.test.ts` - Stack consolidation rules
- `AuditRuleEngine.test.ts` - Rule orchestration & aggregation
- `AuditService.test.ts` - Input validation & service facade
- `AuditIntegration.test.ts` - End-to-end realistic scenarios

### Running Tests

```bash
# All tests
npm test

# Specific test suite
npm test TypeIDefectRules.test.ts

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Key Design Decisions

### 1. Deterministic Rule Execution

- All rules are executed sequentially with consistent logic
- No random sampling, Monte Carlo, or heuristic fuzzing
- Results are reproducible for the same input
- Each rule is mathematically defensible to finance auditors

### 2. Severity Auto-Calculation

Severity is **automatically determined** from savings magnitude, not manually specified:
- `critical` if monthly_savings > $500
- `warning` if monthly_savings > $100
- `info` otherwise

This ensures consistency and prevents subjective severity tagging.

### 3. Minimal Input Validation

- Only validates required fields exist (not data types, ranges, or business logic)
- Validation is intentionally minimal to avoid false rejections
- Rule logic handles edge cases (e.g., <5 seats for Claude)

### 4. Zero-Finding Edge Cases

- If no rules fire, findings array is empty
- Audit result still generated with `audit_tag: "optimal"`
- This signals "stack is well-optimized" rather than "audit failed"

### 5. Rule Independence

- Each rule can be run standalone via `rule.execute(request)`
- No inter-rule dependencies or shared state
- New rules can be added to the engine without modifying existing code

---

## Extending the System

### Adding a New Rule

1. Create new rule class extending `BaseAuditRule`:

```typescript
export class MyNewRule extends BaseAuditRule {
  readonly ruleId = 'RULE_X_Y_MY_NEW_RULE';

  execute(request: AuditRequest): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Your detection logic here
    if (/* condition */) {
      findings.push(
        this.generateFinding(
          'Tool Name',
          'Issue Title',
          'Description',
          'Recommendation',
          monthlySavings
        )
      );
    }

    return findings;
  }
}
```

2. Add to `AuditService` constructor:

```typescript
this.engine = new AuditRuleEngine([
  // ... existing rules
  new MyNewRule(),
]);
```

3. Export from `rules/index.ts`

4. Write unit tests

---

## Performance Characteristics

- **Execution Time**: <1s for typical audit (12 rules against 7 tools)
- **Memory Usage**: Minimal (only audit request + findings array in memory)
- **Scalability**: O(n) where n = number of rules (currently 12)
- **Bottleneck**: JSON parsing of input, not business logic

---

## Future Optimizations

1. **Rule Prioritization**: Execute high-signal rules first, early-exit if high-savings found
2. **Parallel Execution**: Run independent rule groups in parallel threads
3. **Caching**: Cache tool pricing data to avoid recalculation per rule
4. **Custom Rule Engine**: Allow customers to create tenant-specific audit rules
5. **ML-Enhanced Tagging**: Use historical audit data to improve severity/tag classification

---

## Database Schema Integration

The audit result is designed for immediate insertion into a PostgreSQL `audits` table:

```sql
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tools_json JSONB NOT NULL,           -- AuditRequest
  results_json JSONB NOT NULL,         -- AuditResult
  summary TEXT,                        -- LLM-generated summary (nullable)
  tag TEXT NOT NULL,                   -- 'high-savings' | 'medium' | 'optimal'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## References

- **Architecture Document**: `ARCHITECTURE.md` - System design & data flow
- **Pricing Document**: `assets-local/ai-spend-audio-app-design.md` - Vendor pricing matrices & rule definitions
- **Project Structure**: `README.md` - Repository overview
