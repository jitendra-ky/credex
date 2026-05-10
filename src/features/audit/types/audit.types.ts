/**
 * Audit Types and Interfaces
 * Defines all data structures for the AI Spend Audit Engine
 * Follows Single Responsibility Principle - types only
 */

// ============ INPUT TYPES ============

export type UseCase = 'coding' | 'writing' | 'data_analysis' | 'research' | 'mixed_general';
export type BillingCycle = 'monthly' | 'annual';

export type CursorPlan = 'hobby' | 'pro' | 'pro_plus' | 'ultra' | 'business' | 'enterprise';
export type ClaudePlan = 'free' | 'pro' | 'max_5x' | 'max_20x' | 'team_standard' | 'team_premium' | 'enterprise';
export type ChatGPTPlan = 'free' | 'go' | 'plus' | 'pro_100' | 'pro_200' | 'business' | 'enterprise';
export type GeminiPlan = 'free' | 'plus' | 'pro' | 'ultra' | 'business' | 'enterprise_standard' | 'enterprise_plus';
export type V0Plan = 'free' | 'premium' | 'team' | 'business' | 'enterprise';

export type APIModel = 'opus' | 'sonnet' | 'haiku' | 'gpt_5_5' | 'gpt_5_4' | 'gpt_5_4_mini';

// Security Requirements
export interface SecurityRequirements {
  saml_sso_required: boolean;
  scim_automated_provisioning_required: boolean;
  strict_data_privacy_no_training_required: boolean;
}

// Global Context
export interface GlobalContext {
  total_team_size: number;
  primary_use_case: UseCase;
  security_requirements: SecurityRequirements;
}

// Tool-specific inputs
export interface ToolConfig {
  is_active: boolean;
  current_plan?: string;
  number_of_seats?: number;
  billing_cycle?: BillingCycle;
  current_monthly_spend_usd: number;
}

export interface CursorConfig extends ToolConfig {
  current_plan: CursorPlan;
  number_of_seats: number;
  billing_cycle: BillingCycle;
}

export interface ClaudeGUIConfig extends ToolConfig {
  current_plan: ClaudePlan;
  number_of_seats: number;
  billing_cycle: BillingCycle;
}

export interface ChatGPTGUIConfig extends ToolConfig {
  current_plan: ChatGPTPlan;
  number_of_seats: number;
  billing_cycle: BillingCycle;
}

export interface GeminiConfig extends ToolConfig {
  current_plan: GeminiPlan;
  number_of_seats: number;
  billing_cycle: BillingCycle;
}

export interface V0Config extends ToolConfig {
  current_plan: V0Plan;
  number_of_seats: number;
  has_vercel_pro_infrastructure_active: boolean;
}

export interface AnthropicAPIConfig extends ToolConfig {
  primary_model_used: APIModel;
  average_monthly_token_volume_millions: number;
  is_workload_asynchronous: boolean;
  requires_us_data_residency: boolean;
}

export interface OpenAIAPIConfig extends ToolConfig {
  primary_model_used: APIModel;
  average_monthly_token_volume_millions: number;
  is_workload_asynchronous: boolean;
  requires_us_data_residency: boolean;
}

export interface CurrentStack {
  cursor: CursorConfig;
  claude_gui: ClaudeGUIConfig;
  chatgpt_gui: ChatGPTGUIConfig;
  gemini: GeminiConfig;
  v0_vercel: V0Config;
  anthropic_api: AnthropicAPIConfig;
  openai_api: OpenAIAPIConfig;
}

export interface AuditRequest {
  global_context: GlobalContext;
  current_stack: CurrentStack;
}

// ============ OUTPUT TYPES ============

export type Severity = 'critical' | 'warning' | 'info';
export type AuditTag = 'high-savings' | 'medium' | 'optimal';

export interface AuditFinding {
  id: string;
  tool_name: string;
  rule_id: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  monthly_savings_usd: number;
  annual_savings_usd: number;
}

export interface AuditResult {
  audit_id: string;
  findings: AuditFinding[];
  total_monthly_savings_usd: number;
  total_annual_savings_usd: number;
  audit_tag: AuditTag;
  created_at: Date;
}

// ============ DB PERSISTENCE TYPES ============

export interface AuditRecord {
  id: string;
  tools_json: AuditRequest;
  results_json: AuditResult;
  summary: string | null;
  tag: AuditTag;
  created_at: Date;
  updated_at: Date;
}
