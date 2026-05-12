import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AuditFinding, AuditRequest } from '../types/audit.types';

export class SummaryGenerationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Generates a personalized ~100 word summary of the audit findings using Gemini
   * Fallbacks to a generic mock summary if the API fails
   */
  async generateSummary(request: AuditRequest, findings: AuditFinding[], monthlySavings: number): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found. Using fallback summary.');
      return this.getFallbackSummary();
    }

    try {
      const prompt = this.buildPrompt(request, findings, monthlySavings);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      return this.getFallbackSummary();
    }
  }

  private buildPrompt(request: AuditRequest, findings: AuditFinding[], monthlySavings: number): string {
    const findingsList = findings.length > 0 
      ? findings.map(f => `- ${f.tool_name}: ${f.title} ($${f.monthly_savings_usd}/mo savings)`).join('\n')
      : '- No major inefficiencies found.';

    return `You are an expert SaaS procurement consultant specializing in AI infrastructure spend. 
Based on the following audit of a company's AI tools, write a personalized, highly professional, 
and concise summary (around 100 words) of their savings opportunities. 

If they have high savings (>$500/mo), adopt an urgent but professional tone.
If they are already optimal, congratulate them on running a tight ship.
Focus on the most significant findings. Do not hallucinate numbers. Use the data provided.

Context:
Team Size: ${request.global_context.total_team_size}
Primary Use Case: ${request.global_context.primary_use_case}
Total Monthly Savings Found: $${monthlySavings}

Key Findings:
${findingsList}

Summary:`;
  }

  private getFallbackSummary(): string {
    return 'Based on the comprehensive audit of your current AI tool stack, we identified significant optimization opportunities across multiple categories. The analysis reveals inefficiencies in your current plan selections and potential cost redundancies. By implementing the recommended changes, your organization can achieve substantial monthly savings while maintaining or improving security posture and feature coverage. The audit flagged critical areas where plan downgrades, consolidation, or alternative solutions could provide immediate relief without compromising productivity.';
  }
}
