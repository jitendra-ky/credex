/**
 * GET /api/audits/:id
 * Single Responsibility: Fetch and return audit record by ID
 */

import { NextRequest } from 'next/server';
import { getAuditById } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/api/response';
import { NotFoundError, ServiceError, ValidationError } from '@/lib/api/errors';

/**
 * GET /api/audits/:id
 * Fetch a specific audit record by its UUID
 *
 * @param request - NextRequest
 * @param params - Route parameters containing audit ID
 * @returns JSON response with audit data
 *
 * Response:
 * - 200: { success: true, data: { id, tools_json, results_json, tag, created_at, updated_at } }
 * - 400: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } }
 * - 404: { success: false, error: { code: 'NOT_FOUND', message: 'Audit not found' } }
 * - 500: { success: false, error: { code: 'SERVICE_ERROR', message: 'Database query failed' } }
 */
export async function GET(
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

    // Fetch audit from database
    let audit;
    try {
      audit = await getAuditById(id);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceError('Failed to fetch audit record', { details });
    }

    // Check if audit exists
    if (!audit) {
      throw new NotFoundError('Audit', id);
    }

    // Return audit data
    return successResponse(
      {
        id: audit.id,
        tools_json: audit.tools_json,
        results_json: audit.results_json,
        tag: audit.tag,
        created_at: audit.created_at,
        updated_at: audit.updated_at,
      },
      200,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
