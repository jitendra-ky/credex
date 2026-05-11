import { NextRequest } from 'next/server';
import { NotFoundError, ServiceError, ValidationError } from '@/lib/api/errors';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getAuditByShareCode } from '@/lib/db/queries';

/**
 * GET /api/audits/share/:shareCode
 * Public endpoint to fetch a shared audit by its share code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shareCode: string } },
) {
  try {
    const { shareCode } = params;

    if (!shareCode || typeof shareCode !== 'string') {
      throw new ValidationError('Missing or invalid share code');
    }

    let audit;
    try {
      audit = await getAuditByShareCode(shareCode);
    } catch (err) {
      const details = err instanceof Error ? err.message : 'Unknown error';
      throw new ServiceError('Failed to fetch audit by share code', { details });
    }

    if (!audit) {
      throw new NotFoundError('Shared audit', shareCode);
    }

    // Return audit data (strip any sensitive fields if present)
    return successResponse(
      {
        id: audit.id,
        share_code: (audit as any).share_code,
        tools_json: audit.tools_json,
        results_json: audit.results_json,
        summary: audit.summary,
        tag: audit.tag,
        shared_at: (audit as any).shared_at,
        created_at: audit.created_at,
      },
      200,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
