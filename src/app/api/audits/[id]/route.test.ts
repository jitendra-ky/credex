/** @jest-environment node */
// Tests for share endpoints: POST /api/audits/:id/share and GET /api/audits/share/:shareCode

import { POST as postShare } from './share/route';
import { GET as getShared } from '../share/[shareCode]/route';
import * as queriesModule from '@/lib/db/queries';
import { Audit } from '@/lib/db/schema';

// Mock modules
jest.mock('@/lib/db/queries');

// Mock NextRequest
const createMockRequest = (url = 'http://localhost:3000') => ({ url });

describe('POST /api/audits/:id/share', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create a share code when audit exists', async () => {
    const mockAudit: Audit = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tools_json: {} as any,
      results_json: {} as any,
      summary: 'summary',
      tag: 'medium',
      share_code: null,
      is_shared: false,
      shared_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    (queriesModule.getAuditById as jest.Mock).mockResolvedValue(mockAudit);
    (queriesModule.shareAudit as jest.Mock).mockResolvedValue({
      ...mockAudit,
      share_code: 'ABC12345',
      is_shared: true,
      shared_at: new Date(),
    });

    const req = createMockRequest() as any;
    const res = await postShare(req, { params: { id: mockAudit.id } as any } as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.share_code).toBe('ABC12345');
    expect(queriesModule.getAuditById).toHaveBeenCalledWith(mockAudit.id);
    expect(queriesModule.shareAudit).toHaveBeenCalledWith(mockAudit.id, expect.any(String));
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
});

describe('GET /api/audits/share/:shareCode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return shared audit when found', async () => {
    const mockAudit: Audit = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tools_json: {} as any,
      results_json: {} as any,
      summary: 'summary',
      tag: 'medium',
      share_code: 'ABC12345',
      is_shared: true,
      shared_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    (queriesModule.getAuditByShareCode as jest.Mock).mockResolvedValue(mockAudit);

    const req = createMockRequest() as any;
    const res = await getShared(req, { params: { shareCode: 'ABC12345' } as any } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.share_code).toBe('ABC12345');
    expect(queriesModule.getAuditByShareCode).toHaveBeenCalledWith('ABC12345');
  });

  it('should return 404 when shared audit not found', async () => {
    (queriesModule.getAuditByShareCode as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest() as any;
    const res = await getShared(req, { params: { shareCode: 'NOPE' } as any } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
