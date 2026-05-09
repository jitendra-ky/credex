# Quick Start: Audit Service Usage

## Import & Initialize

```typescript
import { AuditService } from '@/features/audit';

const auditService = new AuditService();
```

## Execute Audit

```typescript
const auditResult = await auditService.executeAudit(auditRequest);
```

## Example: Complete Flow

```typescript
import { AuditService, AuditRequest } from '@/features/audit';

// 1. Create service
const auditService = new AuditService();

// 2. Build request (from form data or manual input)
const request: AuditRequest = {
  global_context: {
    total_team_size: 10,
    primary_use_case: 'coding',
    security_requirements: {
      saml_sso_required: true,
      scim_automated_provisioning_required: false,
      strict_data_privacy_no_training_required: false
    }
  },
  current_stack: {
    cursor: {
      is_active: true,
      current_plan: 'business',
      number_of_seats: 10,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 400
    },
    claude_gui: {
      is_active: true,
      current_plan: 'team_standard',
      number_of_seats: 3,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 75
    },
    chatgpt_gui: { is_active: false, current_monthly_spend_usd: 0 },
    gemini: { is_active: false, current_monthly_spend_usd: 0 },
    v0_vercel: {
      is_active: true,
      current_plan: 'team',
      number_of_seats: 10,
      has_vercel_pro_infrastructure_active: false,
      current_monthly_spend_usd: 300
    },
    anthropic_api: {
      is_active: true,
      primary_model_used: 'opus',
      average_monthly_token_volume_millions: 50.0,
      is_workload_asynchronous: true,
      requires_us_data_residency: false,
      current_monthly_spend_usd: 1250
    },
    openai_api: { is_active: false, current_monthly_spend_usd: 0 }
  }
};

// 3. Execute audit
const result = await auditService.executeAudit(request);

// 4. Result structure
console.log(result);
// {
//   audit_id: "550e8400-e29b-41d4-a716-446655440000",
//   findings: [
//     {
//       id: "RULE_1_1-...",
//       tool_name: "Claude GUI",
//       rule_id: "RULE_1_1_CLAUDE_TEAM_MINIMUM",
//       severity: "warning",
//       title: "Claude Team Plan 5-Seat Minimum Violation",
//       description: "You have 3 seats but Team plan enforces 5-seat minimum...",
//       recommendation: "Downgrade to Claude Pro ($20/mo) individual licenses...",
//       monthly_savings_usd: 50,
//       annual_savings_usd: 600
//     },
//     ... more findings
//   ],
//   total_monthly_savings_usd: 850.50,
//   total_annual_savings_usd: 10206,
//   audit_tag: "high-savings",
//   created_at: 2026-05-08T14:32:45.123Z
// }

// 5. Insert to database
const auditRecord = {
  id: result.audit_id,
  tools_json: request,
  results_json: result,
  summary: null, // Will be populated by LLM service
  tag: result.audit_tag,
  created_at: result.created_at,
  updated_at: new Date()
};

await db.insert(audits).values(auditRecord);

// 6. Return to client
return Response.json(result);
```

## Error Handling

```typescript
try {
  const result = await auditService.executeAudit(request);
} catch (error) {
  if (error instanceof Error) {
    console.error('Audit failed:', error.message);
    // Handle validation errors:
    // - "Missing global_context in audit request"
    // - "Missing security_requirements in audit request"
    // - "Missing current_stack in audit request"
    // - "At least one tool must be active in current_stack"
  }
}
```

## Output Fields Explanation

### Finding Object
- `id`: Unique finding identifier
- `tool_name`: Which tool has the issue (e.g., "Claude GUI", "Anthropic API")
- `rule_id`: Which rule triggered (e.g., "RULE_1_1_CLAUDE_TEAM_MINIMUM")
- `severity`: "critical" (>$500/mo) | "warning" ($100-500/mo) | "info" (<$100/mo)
- `title`: Human-readable issue name
- `description`: Detailed explanation with numbers
- `recommendation`: How to fix the issue
- `monthly_savings_usd`: Potential monthly savings (2 decimals)
- `annual_savings_usd`: Potential annual savings (2 decimals)

### Result Object
- `audit_id`: UUID for database insertion
- `findings`: Array of detected issues (sorted by severity then savings)
- `total_monthly_savings_usd`: Sum of all findings' monthly savings
- `total_annual_savings_usd`: Sum of all findings' annual savings
- `audit_tag`: Severity classification:
  - "high-savings": >$500/mo (immediate action)
  - "medium": $100-500/mo (optimization opportunity)
  - "optimal": <$100/mo (well-optimized)
- `created_at`: Timestamp for audit record

## Severity Auto-Calculation

Severity is **automatically determined** from savings:

```typescript
// In BaseAuditRule.generateFinding()
severity = monthlySavings > 500 ? 'critical' : 
           monthlySavings > 100 ? 'warning' : 
           'info'
```

No manual overrides needed.

## API Route Integration

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
    // TODO: Generate LLM summary
    // TODO: Send email

    return Response.json(auditResult);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Audit failed' },
      { status: 400 }
    );
  }
}
```

## Performance

- Typical execution: <1 second
- All 12 rules executed sequentially
- No external API calls
- Pure TypeScript computation

## Extending with Custom Rules

```typescript
import { BaseAuditRule } from '@/features/audit';
import { AuditFinding, AuditRequest } from '@/features/audit/types/audit.types';

export class MyCustomRule extends BaseAuditRule {
  readonly ruleId = 'RULE_X_Y_CUSTOM';

  execute(request: AuditRequest): AuditFinding[] {
    // Your logic here
    return [this.generateFinding(
      'Tool Name',
      'Issue Title',
      'Description',
      'Recommendation',
      monthlySavings
    )];
  }
}

// Add to AuditService constructor:
this.engine = new AuditRuleEngine([
  // ... existing rules
  new MyCustomRule(),
]);
```

## Debugging

```typescript
// Enable logging in rules
const result = await auditService.executeAudit(request);

// Inspect findings
result.findings.forEach(f => {
  console.log(`${f.rule_id}: ${f.title}`);
  console.log(`  Savings: $${f.monthly_savings_usd}/mo`);
  console.log(`  Recommendation: ${f.recommendation}`);
});

// Check total impact
console.log(`Total: $${result.total_monthly_savings_usd}/mo`);
console.log(`Classification: ${result.audit_tag}`);
```

## Testing

```bash
# Run all audit tests
npm test src/features/audit

# Run specific test file
npm test TypeIDefectRules.test.ts

# Run with coverage
npm test -- --coverage src/features/audit

# Watch mode
npm test -- --watch src/features/audit
```

---

**For complete documentation, see [src/features/audit/README.md](../audit/README.md)**
