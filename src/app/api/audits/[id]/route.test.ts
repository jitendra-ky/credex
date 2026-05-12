/** @jest-environment node */
// Tests for share endpoint: POST /api/audits/:id/share

import { POST as postShare } from './share/route';
import * as queriesModule from '@/lib/db/queries';
import { Audit } from '@/lib/db/schema';

// Mock modules
jest.mock('@/lib/db/queries');

// Mock NextRequest
const createMockRequest = (url = 'http://localhost:3000') => ({ url });

describe('POST /api/audits/:id/share', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should mark audit as shared when audit exists and is not shared', async () => {
    const mockAudit: Audit = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tools_json: {} as any,
      results_json: {} as any,
      summary: 'summary',
      tag: 'medium',
      is_shared: false,
      shared_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    (queriesModule.getAuditById as jest.Mock).mockResolvedValue(mockAudit);
    (queriesModule.shareAudit as jest.Mock).mockResolvedValue({
      ...mockAudit,
      is_shared: true,
      shared_at: new Date(),
    });

    const req = createMockRequest() as any;
    const res = await postShare(req, { params: { id: mockAudit.id } as any } as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.audit_id).toBe(mockAudit.id);
    expect(body.data.is_shared).toBe(true);
    expect(queriesModule.getAuditById).toHaveBeenCalledWith(mockAudit.id);
    expect(queriesModule.shareAudit).toHaveBeenCalledWith(mockAudit.id);
  });

  it('should return existing shared status if audit is already shared', async () => {
    const mockAudit: Audit = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tools_json: {} as any,
      results_json: {} as any,
      summary: 'summary',
      tag: 'medium',
      is_shared: true,
      shared_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    (queriesModule.getAuditById as jest.Mock).mockResolvedValue(mockAudit);

    const req = createMockRequest() as any;
    const res = await postShare(req, { params: { id: mockAudit.id } as any } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.audit_id).toBe(mockAudit.id);
    expect(body.data.is_shared).toBe(true);
    // Should NOT call shareAudit since it's already shared
    expect(queriesModule.shareAudit).not.toHaveBeenCalled();
  });

  it('should return 404 when audit not found', async () => {
    (queriesModule.getAuditById as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest() as any;
    const res = await postShare(req, {
      params: { id: '550e8400-e29b-41d4-a716-446655440000' } as any,
    } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for invalid UUID format', async () => {
    const req = createMockRequest() as any;
    const res = await postShare(req, {
      params: { id: 'not-a-valid-uuid' } as any,
    } as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
