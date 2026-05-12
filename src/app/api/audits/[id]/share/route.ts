import { NextRequest } from 'next/server';
import { ValidationError, NotFoundError, ServiceError } from '@/lib/api/errors';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getAuditById, shareAudit } from '@/lib/db/queries';

/**
 * POST /api/audits/:id/share
 * Mark an audit as publicly shared via its UUID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError(`Invalid audit ID format: "${id}"`);
    }

    // Fetch audit
    let audit;
    try {
      audit = await getAuditById(id);
    } catch (err) {
      const details = err instanceof Error ? err.message : 'Unknown error';
      throw new ServiceError('Failed to fetch audit record', { details });
    }

    if (!audit) {
      throw new NotFoundError('Audit', id);
    }

    // If already shared, return success
    if (audit.is_shared) {
      return successResponse({ audit_id: audit.id, is_shared: true }, 200);
    }

    // Mark audit as shared
    try {
      const updated = await shareAudit(id);
      return successResponse({ audit_id: updated.id, is_shared: true }, 201);
    } catch (err) {
      const details = err instanceof Error ? err.message : 'Unknown error';
      throw new ServiceError('Failed to share audit', { details });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
