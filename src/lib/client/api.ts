/**
 * Client API wrapper
 * Centralized fetch calls to the 4 documented endpoints
 */

import type { AuditRequest, AuditResult } from '@/features/audit/types/audit.types';
import type { LeadRequest, LeadResponse } from '@/features/leads/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  timestamp: string;
}

interface ShareCodeResponse {
  share_code: string;
}

class ClientApi {
  private baseUrl = '';

  /**
   * POST /api/audit
   * Submit audit request and get findings
   */
  async submitAudit(request: AuditRequest): Promise<AuditResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: ApiResponse<AuditResult> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Audit submission failed');
      }
      return data.data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Server returned invalid response');
      }
      throw err;
    }
  }

  /**
   * POST /api/leads
   * Capture lead information
   */
  async captureLead(request: LeadRequest): Promise<LeadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: ApiResponse<LeadResponse> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Lead capture failed');
      }
      return data.data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Server returned invalid response');
      }
      throw err;
    }
  }

  /**
   * POST /api/audits/:id/share
   * Generate a share code for an audit
   */
  async generateShareCode(auditId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/audits/${auditId}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: ApiResponse<ShareCodeResponse> = await response.json();
      if (!data.success || !data.data?.share_code) {
        throw new Error(data.error?.message || 'Share code generation failed');
      }
      return data.data.share_code;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Server returned invalid response');
      }
      throw err;
    }
  }

  /**
   * GET /api/audits/share/:shareCode
   * Fetch a publicly shared audit
   */
  async getSharedAudit(shareCode: string): Promise<AuditResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/audits/share/${shareCode}`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: ApiResponse<AuditResult> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch shared audit');
      }
      return data.data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Server returned invalid response');
      }
      throw err;
    }
  }
}

export const clientApi = new ClientApi();
