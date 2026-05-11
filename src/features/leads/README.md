  
# Lead Capture Feature

## Overview
POST `/api/leads` endpoint for capturing user email, company, and role from audit results page.

## Minimal Implementation
- **Total code**: ~210 lines (services + route)
- **Zero duplication**: Reuses existing DB schema, validators, error classes
- **Per-IP rate limiting**: 5 leads / 15 min (configurable)
- **Fire-and-forget email**: Errors logged, don't block form
- **Type-safe**: Full TypeScript, Zod validation

## API Contract

### Request
```json
POST /api/leads
Content-Type: application/json

{
  "email": "user@example.com",        // Required, trimmed, validated
  "company_name": "Acme Corp",        // Optional, trimmed
  "role": "CTO",                      // Optional, trimmed
  "audit_id": "uuid"                  // Optional, links to audit
}
```

### Response (201 - New Lead)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "company_name": "Acme Corp",
    "role": "CTO",
    "audit_id": "uuid",
    "created_at": "2025-05-11T10:30:00Z",
    "updated_at": "2025-05-11T10:30:00Z",
    "is_new": true
  }
}
```

### Response (200 - Duplicate)
Same as 201 but `is_new: false`

### Errors

#### 400 - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid lead request",
    "details": "Invalid email"
  }
}
```

#### 429 - Rate Limited
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded: 5 leads per 15 minutes"
  }
}
```

#### 500 - Service Error
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_ERROR",
    "message": "Failed to save lead"
  }
}
```

## Architecture

### Database Layer (Existing)
- **Schema**: `leadsTable` with email unique index
- **Queries**: `upsertLead()`, `getLeadByEmail()`, `getLeadsByIpInWindow()`

### Services (New)
1. **RateLimitService**
   - `checkRateLimit(ip)` — Throws RateLimitError if limit exceeded
   - Uses DB query: `getLeadsByIpInWindow(ip, 15 min)`

2. **EmailService**
   - `sendLeadConfirmation(email, company_name)` — Fire-and-forget
   - Placeholder for Resend API integration
   - Errors logged, never thrown

3. **LeadService** (Orchestrator)
   - `captureLead(request, ip_address)` — Coordinates workflow
   - Steps: Validate → Rate limit → DB upsert → Async email
   - Returns `LeadResponse` with `is_new` flag

### API Route
- Extracts client IP from headers (`x-forwarded-for`, `x-real-ip`)
- Calls `LeadService.captureLead()`
- Returns 201 (new) or 200 (duplicate)
- Structured error responses with HTTP status codes

## SOLID Compliance

| Principle | Implementation |
|-----------|---|
| **Single Responsibility** | Each service does one thing: RateLimitService checks limits, EmailService sends emails, LeadService orchestrates |
| **Open/Closed** | Services extend without modification; email backend swappable |
| **Liskov Substitution** | Services are composable; no forced contracts |
| **Interface Segregation** | Minimal interfaces; each service exposes only what it needs |
| **Dependency Inversion** | Services depend on abstractions (error classes, DB queries) not concretions |

## Testing
- ✅ 9/9 unit tests passing
- ✅ Coverage: validation, rate limiting, DB errors, email errors, nulls
- ✅ Integration test mocks services end-to-end
- ✅ TypeScript: No errors

## Future Enhancements
1. **Email Integration**: Connect Resend API when key available
2. **Rate Limit Tuning**: Add per-email limits, exponential backoff
3. **Audit Context**: Include audit results in email template
4. **Lead Scoring**: Add lead quality scoring based on company data
5. **CRM Integration**: Post-lead webhooks to Salesforce, HubSpot

## Files Created/Modified
```
✅ src/lib/api/errors.ts                                 (RateLimitError)
✅ src/lib/validators/index.ts                          (leadRequestSchema)
✅ src/features/leads/types/index.ts                    (LeadRequest, LeadResponse)
✅ src/features/leads/services/RateLimitService.ts      (Rate limit check)
✅ src/features/leads/services/EmailService.ts          (Email send placeholder)
✅ src/features/leads/services/LeadService.ts           (Main orchestrator)
✅ src/features/leads/services/__tests__/LeadService.test.ts  (9 tests)
✅ src/app/api/leads/route.ts                           (POST handler)
✅ src/app/api/leads/__tests__/route.test.ts            (Integration tests)
✅ src/features/leads/index.ts                          (Barrel export)
✅ jest.setup.node.js                                   (TextEncoder polyfill)
```

## Next Steps
1. **Frontend**: Build lead capture form component
2. **Email**: Integrate Resend API with template
3. **Monitoring**: Add metrics for lead volume, rate limit hits
4. **A/B Testing**: Test form placement, incentives, copy
