/**
 * POST /api/audit
 * Single Responsibility: Handle audit request, orchestrate business logic, return results
 * Request flow: Validate → Execute Audit → Persist → Return
 */

import { NextRequest } from 'next/server';
import { auditRequestSchema } from '@/lib/validators';
import { AuditService } from '@/features/audit/services/AuditService';
import { createAudit } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ValidationError, ServiceError } from '@/lib/api/errors';
import { AuditRequest } from '@/features/audit/types/audit.types';

/**
 * POST /api/audit
 * Execute an AI spend audit against the provided tool configuration
 *
 * @param request - NextRequest containing AuditRequest in body
 * @returns JSON response with audit results and audit_id
 *
 * Response:
 * - 200: { success: true, data: { audit_id, findings, total_monthly_savings_usd, total_annual_savings_usd, audit_tag } }
 * - 400: { success: false, error: { code: 'VALIDATION_ERROR', message: 'error details' } }
 * - 500: { success: false, error: { code: 'SERVICE_ERROR', message: 'error details' } }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Step 2: Validate request against schema
    let validatedRequest: AuditRequest;
    try {
      validatedRequest = auditRequestSchema.parse(body);
    } catch (error) {
      const details =
        error instanceof Error ? error.message : 'Validation failed';
      throw new ValidationError('Invalid audit request', { details });
    }

    // Step 3: Execute audit using AuditService
    const auditService = new AuditService();
    let auditResult;
    try {
      auditResult = await auditService.executeAudit(validatedRequest);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceError('Audit execution failed', { details });
    }

    // Step 4: Persist to database
    let persistedAudit;
    try {
      persistedAudit = await createAudit(validatedRequest, auditResult);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceError('Failed to persist audit record', { details });
    }

    // Step 5: Return results
    return successResponse(
      {
        audit_id: persistedAudit.id,
        findings: auditResult.findings,
        total_monthly_savings_usd: auditResult.total_monthly_savings_usd,
        total_annual_savings_usd: auditResult.total_annual_savings_usd,
        audit_tag: auditResult.audit_tag,
      },
      200,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
