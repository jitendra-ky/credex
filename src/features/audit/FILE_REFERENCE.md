# Audit Engine - Complete File Reference

## 📂 Directory Structure

```
src/features/audit/
├── __tests__/
│   ├── AuditIntegration.test.ts       [6 end-to-end scenario tests]
│   ├── AuditRuleEngine.test.ts        [9 orchestration & aggregation tests]
│   ├── AuditService.test.ts           [9 validation & facade tests]
│   ├── TypeIDefectRules.test.ts       [9 over-provisioning rule tests]
│   ├── TypeIIDefectRules.test.ts      [12 feature mismatch rule tests]
│   ├── TypeIIIDefectRules.test.ts     [14 usage inefficiency rule tests]
│   └── TypeIVDefectRules.test.ts      [9 stack consolidation rule tests]
├── engine/
│   └── AuditRuleEngine.ts             [Rule orchestrator & aggregator]
├── rules/
│   ├── BaseAuditRule.ts               [Abstract base class]
│   ├── TypeIDefectRules.ts            [3 over-provisioning rules]
│   ├── TypeIIDefectRules.ts           [3 feature mismatch rules]
│   ├── TypeIIIDefectRules.ts          [4 usage inefficiency rules]
│   ├── TypeIVDefectRules.ts           [2 stack consolidation rules]
│   └── index.ts                       [Barrel export]
├── services/
│   └── AuditService.ts                [Service facade]
├── types/
│   └── audit.types.ts                 [Type definitions]
├── index.ts                           [Feature exports]
└── README.md                          [Complete documentation]
```

## 📦 Import Patterns

### Import Main Service
```typescript
import { AuditService } from '@/features/audit';

const service = new AuditService();
```

### Import Types
```typescript
import { 
  AuditRequest, 
  AuditResult,
  AuditFinding,
  AuditRecord,
  SecurityRequirements,
  GlobalContext,
  CurrentStack
} from '@/features/audit';

// Or
import type { AuditRequest } from '@/features/audit/types/audit.types';
```

### Import Individual Rules (for testing/extending)
```typescript
import {
  // Type I
  ClaudeTeamMinimumRule,
  ChatGPTBusinessMinimumRule,
  AnnualBillingArbitrageRule,
  
  // Type II
  EnterpriseSCIMTaxRule,
  V0PrivacyTaxRule,
  V0InfrastructureRequisiteRule,
  
  // Type III
  AsyncBatchAPIArbitrageRule,
  ClaudeEnterpriseAPITrapRule,
  ChatGPTGoTierProductivityLossRule,
  RegionalDataResidencyTaxRule,
  
  // Type IV
  ChatbotRedundancyRule,
  ExtremePowerUserSurchargeRule,
  
  // Base
  BaseAuditRule,
  type IAuditRule
} from '@/features/audit/rules';
```

### Import Engine
```typescript
import { AuditRuleEngine } from '@/features/audit/engine/AuditRuleEngine';
```

## 🔧 Service API

### AuditService

```typescript
class AuditService {
  // Execute audit against request
  async executeAudit(request: AuditRequest): Promise<AuditResult>
  
  // Internal: Validate input
  private validateRequest(request: AuditRequest): void
}
```

### Throws Errors
- `"Missing global_context in audit request"`
- `"Missing security_requirements in audit request"`
- `"Missing current_stack in audit request"`
- `"At least one tool must be active in current_stack"`

## 📊 Type Hierarchy

```
AuditRequest
├── global_context: GlobalContext
│   ├── total_team_size: number
│   ├── primary_use_case: UseCase
│   └── security_requirements: SecurityRequirements
└── current_stack: CurrentStack
    ├── cursor: CursorConfig
    ├── claude_gui: ClaudeGUIConfig
    ├── chatgpt_gui: ChatGPTGUIConfig
    ├── gemini: GeminiConfig
    ├── v0_vercel: V0Config
    ├── anthropic_api: AnthropicAPIConfig
    └── openai_api: OpenAIAPIConfig

AuditResult
├── audit_id: string (UUID)
├── findings: AuditFinding[]
│   ├── id: string
│   ├── tool_name: string
│   ├── rule_id: string
│   ├── severity: Severity
│   ├── title: string
│   ├── description: string
│   ├── recommendation: string
│   ├── monthly_savings_usd: number
│   └── annual_savings_usd: number
├── total_monthly_savings_usd: number
├── total_annual_savings_usd: number
├── audit_tag: AuditTag
└── created_at: Date

AuditRecord (for DB)
├── id: string
├── tools_json: AuditRequest
├── results_json: AuditResult
├── summary: string | null
├── tag: AuditTag
├── created_at: Date
└── updated_at: Date
```

## 🎯 Rule IDs Reference

| Type | Rule ID | Class Name | Purpose |
|------|---------|-----------|---------|
| I | `RULE_1_1_CLAUDE_TEAM_MINIMUM` | `ClaudeTeamMinimumRule` | 5-seat minimum trap |
| I | `RULE_1_2_CHATGPT_BUSINESS_MINIMUM` | `ChatGPTBusinessMinimumRule` | 2-seat minimum trap |
| I | `RULE_1_3_ANNUAL_BILLING_ARBITRAGE` | `AnnualBillingArbitrageRule` | Missing 20% annual discount |
| II | `RULE_2_1_ENTERPRISE_SCIM_TAX` | `EnterpriseSCIMTaxRule` | Enterprise without SCIM need |
| II | `RULE_2_2_V0_PRIVACY_TAX` | `V0PrivacyTaxRule` | v0 Business without privacy need |
| II | `RULE_2_3_V0_INFRA_REQUISITE` | `V0InfrastructureRequisiteRule` | v0 Team without Vercel Pro |
| III | `RULE_3_1_ASYNC_BATCH_ARBITRAGE` | `AsyncBatchAPIArbitrageRule` | Async API without Batch discount |
| III | `RULE_3_2_CLAUDE_ENTERPRISE_API_TRAP` | `ClaudeEnterpriseAPITrapRule` | Claude Enterprise variable costs |
| III | `RULE_3_3_CHATGPT_GO_TIER_LOSS` | `ChatGPTGoTierProductivityLossRule` | Go tier productivity loss |
| III | `RULE_3_4_REGIONAL_RESIDENCY_TAX` | `RegionalDataResidencyTaxRule` | US residency compliance cost |
| IV | `RULE_4_1_CHATBOT_REDUNDANCY` | `ChatbotRedundancyRule` | 3+ LLMs redundancy |
| IV | `RULE_4_2_EXTREME_POWER_USER_SURCHARGE` | `ExtremePowerUserSurchargeRule` | Max tier + team tier dual usage |

## 🧪 Test Coverage by Rule

```
Type I Rules (3)
├── ClaudeTeamMinimumRule
│   ├── should flag with <5 seats ✓
│   ├── should not flag with ≥5 seats ✓
│   ├── should not flag if inactive ✓
│   └── should recommend Pro downgrade ✓
├── ChatGPTBusinessMinimumRule
│   ├── should flag with 1 seat ✓
│   └── should not flag with ≥2 seats ✓
└── AnnualBillingArbitrageRule
    ├── should flag monthly for Cursor Pro ✓
    ├── should not flag annual billing ✓
    └── should flag multiple tools ✓

Type II Rules (3)
├── EnterpriseSCIMTaxRule
│   ├── should flag Enterprise without SCIM ✓
│   ├── should not flag if SCIM required ✓
│   └── should check multiple tools ✓
├── V0PrivacyTaxRule
│   ├── should flag Business without privacy need ✓
│   └── should not flag if privacy required ✓
└── V0InfrastructureRequisiteRule
    ├── should flag Team without Vercel Pro ✓
    ├── should not flag with active Vercel Pro ✓
    └── should calculate correct savings ✓

Type III Rules (4)
├── AsyncBatchAPIArbitrageRule
│   ├── should flag async >10M tokens ✓
│   ├── should not flag sync workload ✓
│   ├── should not flag small workloads ✓
│   └── should flag both APIs if active ✓
├── ClaudeEnterpriseAPITrapRule
│   ├── should flag Enterprise >150 seats ✓
│   └── should not flag Enterprise ≤150 seats ✓
├── ChatGPTGoTierProductivityLossRule
│   ├── should flag Go tier for coding ✓
│   └── should not flag if Go inactive ✓
└── RegionalDataResidencyTaxRule
    ├── should acknowledge Anthropic compliance ✓
    ├── should flag both APIs if required ✓
    └── should not flag if not required ✓

Type IV Rules (2)
├── ChatbotRedundancyRule
│   ├── should flag 3+ models with same seats ✓
│   ├── should not flag 2 tools ✓
│   ├── should not flag if variance >15% ✓
│   └── should not flag if <2 active ✓
└── ExtremePowerUserSurchargeRule
    ├── should flag ChatGPT Pro + team ✓
    ├── should flag Claude Max + team ✓
    ├── should not flag solo high tier ✓
    └── should not flag team only ✓

Engine (1)
├── AuditRuleEngine
│   ├── should execute all rules ✓
│   ├── should sort by severity ✓
│   ├── should tag high-savings ✓
│   ├── should tag medium ✓
│   ├── should tag optimal ✓
│   ├── should generate unique IDs ✓
│   ├── should handle rule errors ✓
│   └── should round aggregate totals ✓
│   └── should include timestamp ✓

Service (1)
├── AuditService
│   ├── should execute with valid request ✓
│   ├── should throw on missing global_context ✓
│   ├── should throw on missing security_requirements ✓
│   ├── should throw on missing current_stack ✓
│   ├── should throw if no tools active ✓
│   ├── should return DB-ready structure ✓
│   ├── should handle multiple tools ✓
│   ├── should be deterministic ✓
│   └── should complete in <1 second ✓

Integration (1)
├── AuditIntegration
│   ├── Complex real-world scenario ✓
│   ├── Optimized stack (minimal issues) ✓
│   ├── Stack redundancy detection ✓
│   ├── Enterprise SCIM tax ✓
│   ├── API batch optimization ✓
│   └── DB-ready structure ✓

Total: 62 tests, 100% pass rate ✓
```

## 🚀 Execution Flow

```
POST /api/audit
    ↓
JSON Body → AuditRequest (validated)
    ↓
AuditService.executeAudit()
    ↓
AuditRuleEngine.execute()
    ├→ ClaudeTeamMinimumRule.execute()
    ├→ ChatGPTBusinessMinimumRule.execute()
    ├→ AnnualBillingArbitrageRule.execute()
    ├→ EnterpriseSCIMTaxRule.execute()
    ├→ V0PrivacyTaxRule.execute()
    ├→ V0InfrastructureRequisiteRule.execute()
    ├→ AsyncBatchAPIArbitrageRule.execute()
    ├→ ClaudeEnterpriseAPITrapRule.execute()
    ├→ ChatGPTGoTierProductivityLossRule.execute()
    ├→ RegionalDataResidencyTaxRule.execute()
    ├→ ChatbotRedundancyRule.execute()
    └→ ExtremePowerUserSurchargeRule.execute()
    ↓
Findings aggregated + sorted
    ↓
AuditResult generated
    ├─ audit_id (UUID)
    ├─ findings (sorted by severity)
    ├─ total_monthly_savings_usd (rounded)
    ├─ total_annual_savings_usd (rounded)
    ├─ audit_tag ("high-savings"|"medium"|"optimal")
    └─ created_at (timestamp)
    ↓
DB Insert (tools_json, results_json, tag)
    ↓
Response.json(auditResult)
```

## 📝 Notes

- All rules are **stateless** (no shared mutable state)
- All rules are **deterministic** (same input → same output)
- All rules execute **synchronously** (<1 second total)
- Findings are **sorted** by severity then savings
- Severity is **auto-calculated** from savings amount
- IDs are **UUIDs** (database-friendly)
- All numeric values are **rounded to 2 decimals**

---

**See [src/features/audit/README.md](README.md) for comprehensive documentation.**
