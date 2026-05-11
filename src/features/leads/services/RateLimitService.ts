/**
 * Rate Limit Service
 * Single Responsibility: Check if lead submission exceeds rate limit
 * Per-IP rate limiting using database queries
 */

import { getLeadsByIpInWindow } from '@/lib/db/queries';
import { RateLimitError } from '@/lib/api/errors';

export class RateLimitService {
  /**
   * Check if IP has exceeded rate limit
   * @param ipAddress - Client IP address
   * @param limit - Maximum leads allowed (default: 5)
   * @param windowMinutes - Time window in minutes (default: 15)
   * @throws RateLimitError if limit exceeded
   */
  async checkRateLimit(
    ipAddress: string,
    limit: number = 5,
    windowMinutes: number = 15,
  ): Promise<void> {
    const recentLeads = await getLeadsByIpInWindow(ipAddress, windowMinutes);

    if (recentLeads.length >= limit) {
      throw new RateLimitError(
        `Rate limit exceeded: ${limit} leads per ${windowMinutes} minutes`,
      );
    }
  }
}
