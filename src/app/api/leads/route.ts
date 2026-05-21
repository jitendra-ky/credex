/**
 * POST /api/leads
 * Lead capture endpoint
 * Accepts: email, company_name, role, audit_id
 * audit_id is stored in leadAuditsTable (not on the lead row itself)
 * Returns: Saved lead with is_new flag
 */

import { LeadService } from '@/features/leads/services/LeadService';
import { isApiError } from '@/lib/api/errors';

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  // Fallback: use 0.0.0.0 if no IP found (localhost/dev environment)
  return '0.0.0.0';
}

export async function POST(request: Request) {
  const leadService = new LeadService();

  try {
    const body = await request.json();
    const ipAddress = getClientIp(request);

    const result = await leadService.captureLead(body, ipAddress);

    // Return 201 for new leads, 200 for duplicates
    const statusCode = result.is_new ? 201 : 200;

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: statusCode },
    );
  } catch (error) {
    if (isApiError(error)) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode },
      );
    }

    // Unexpected error
    return Response.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 },
    );
  }
}
