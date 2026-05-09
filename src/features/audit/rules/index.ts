/**
 * Rules Barrel Export
 * Central export point for all audit rules
 */

// Type I: Over-provisioning
export { ClaudeTeamMinimumRule } from './TypeIDefectRules';
export { ChatGPTBusinessMinimumRule } from './TypeIDefectRules';
export { AnnualBillingArbitrageRule } from './TypeIDefectRules';

// Type II: Feature Mismatch
export { EnterpriseSCIMTaxRule } from './TypeIIDefectRules';
export { V0PrivacyTaxRule } from './TypeIIDefectRules';
export { V0InfrastructureRequisiteRule } from './TypeIIDefectRules';

// Type III: Usage Inefficiency
export { AsyncBatchAPIArbitrageRule } from './TypeIIIDefectRules';
export { ClaudeEnterpriseAPITrapRule } from './TypeIIIDefectRules';
export { ChatGPTGoTierProductivityLossRule } from './TypeIIIDefectRules';
export { RegionalDataResidencyTaxRule } from './TypeIIIDefectRules';

// Type IV: Stack Consolidation
export { ChatbotRedundancyRule } from './TypeIVDefectRules';
export { ExtremePowerUserSurchargeRule } from './TypeIVDefectRules';

// Base
export { BaseAuditRule, type IAuditRule } from './BaseAuditRule';
