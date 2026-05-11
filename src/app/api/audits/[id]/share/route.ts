import { NextRequest } from 'next/server';
import { ValidationError, NotFoundError, ServiceError } from '@/lib/api/errors';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getAuditById, shareAudit } from '@/lib/db/queries';
import { generateShareCode } from '@/lib/utils/shareCodeGenerator';

/**
 * POST /api/audits/:id/share
 * Generate a unique share code and mark the audit as shared
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

    // If already shared, return existing code
    if ((audit as any).share_code) {
      return successResponse({ share_code: (audit as any).share_code }, 200);
    }

    // Generate and persist unique share code with retry
    const maxAttempts = 5;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = generateShareCode();
      try {
        const updated = await shareAudit(id, code);
        return successResponse({ share_code: updated.share_code }, 201);
      } catch (err) {
        lastError = err;
        // On conflict (duplicate share_code), retry with new code
        // Other errors will be handled after retries
        continue;
      }
    }

    throw new ServiceError('Failed to generate unique share code', { details: lastError });
  } catch (error) {
    return errorResponse(error);
  }
}
