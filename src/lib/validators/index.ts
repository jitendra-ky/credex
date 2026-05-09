/**
 * Request Validators
 * Single Responsibility: Define Zod schemas for request validation
 * Ensures type-safe request validation at API boundaries
 */

import { z } from 'zod';
import type {
  UseCase,
  BillingCycle,
  CursorPlan,
  ClaudePlan,
  ChatGPTPlan,
  GeminiPlan,
  V0Plan,
  APIModel,
} from '@/features/audit/types/audit.types';

/**
 * Enum validators
 */
const useCaseSchema = z.enum([
  'coding',
  'writing',
  'data_analysis',
  'research',
  'mixed_general',
]);

const billingCycleSchema = z.enum(['monthly', 'annual']);

const cursorPlanSchema = z.enum([
  'hobby',
  'pro',
  'pro_plus',
  'ultra',
  'business',
  'enterprise',
]);

const claudePlanSchema = z.enum([
  'free',
  'pro',
  'max_5x',
  'max_20x',
  'team_standard',
  'team_premium',
  'enterprise',
]);

const chatGPTPlanSchema = z.enum([
  'free',
  'go',
  'plus',
  'pro_100',
  'pro_200',
  'business',
  'enterprise',
]);

const geminiPlanSchema = z.enum([
  'free',
  'plus',
  'pro',
  'ultra',
  'business',
  'enterprise_standard',
  'enterprise_plus',
]);

const v0PlanSchema = z.enum([
  'free',
  'premium',
  'team',
  'business',
  'enterprise',
]);

const apiModelSchema = z.enum([
  'opus',
  'sonnet',
  'haiku',
  'gpt_5_5',
  'gpt_5_4',
  'gpt_5_4_mini',
]);

/**
 * Base tool config schema
 */
const baseToolConfigSchema = z.object({
  is_active: z.boolean(),
  current_monthly_spend_usd: z.number().nonnegative(),
});

/**
 * Specific tool config schemas
 */
const cursorConfigSchema = baseToolConfigSchema.extend({
  current_plan: cursorPlanSchema,
  number_of_seats: z.number().int().positive(),
  billing_cycle: billingCycleSchema,
});

const claudeGUIConfigSchema = baseToolConfigSchema.extend({
  current_plan: claudePlanSchema,
  number_of_seats: z.number().int().positive(),
  billing_cycle: billingCycleSchema,
});

const chatGPTGUIConfigSchema = baseToolConfigSchema.extend({
  current_plan: chatGPTPlanSchema,
  number_of_seats: z.number().int().positive(),
  billing_cycle: billingCycleSchema,
});

const geminiConfigSchema = baseToolConfigSchema.extend({
  current_plan: geminiPlanSchema,
  number_of_seats: z.number().int().positive(),
  billing_cycle: billingCycleSchema,
});

const v0ConfigSchema = baseToolConfigSchema.extend({
  current_plan: v0PlanSchema,
  number_of_seats: z.number().int().positive(),
  has_vercel_pro_infrastructure_active: z.boolean(),
});

const anthropicAPIConfigSchema = baseToolConfigSchema.extend({
  primary_model_used: apiModelSchema,
  average_monthly_token_volume_millions: z.number().nonnegative(),
  is_workload_asynchronous: z.boolean(),
  requires_us_data_residency: z.boolean(),
});

const openAIAPIConfigSchema = baseToolConfigSchema.extend({
  primary_model_used: apiModelSchema,
  average_monthly_token_volume_millions: z.number().nonnegative(),
  is_workload_asynchronous: z.boolean(),
  requires_us_data_residency: z.boolean(),
});

/**
 * Security requirements schema
 */
const securityRequirementsSchema = z.object({
  saml_sso_required: z.boolean(),
  scim_automated_provisioning_required: z.boolean(),
  strict_data_privacy_no_training_required: z.boolean(),
});

/**
 * Global context schema
 */
const globalContextSchema = z.object({
  total_team_size: z.number().int().positive(),
  primary_use_case: useCaseSchema,
  security_requirements: securityRequirementsSchema,
});

/**
 * Current stack schema
 */
const currentStackSchema = z.object({
  cursor: cursorConfigSchema,
  claude_gui: claudeGUIConfigSchema,
  chatgpt_gui: chatGPTGUIConfigSchema,
  gemini: geminiConfigSchema,
  v0_vercel: v0ConfigSchema,
  anthropic_api: anthropicAPIConfigSchema,
  openai_api: openAIAPIConfigSchema,
});

/**
 * Main audit request schema
 * Validates incoming POST /api/audit requests
 */
export const auditRequestSchema = z.object({
  global_context: globalContextSchema,
  current_stack: currentStackSchema,
});

export type ValidatedAuditRequest = z.infer<typeof auditRequestSchema>;

/**
 * Schema for URL parameter validation
 */
export const auditIdParamSchema = z.object({
  id: z.string().uuid('Invalid audit ID format'),
});

export type ValidatedAuditIdParam = z.infer<typeof auditIdParamSchema>;
