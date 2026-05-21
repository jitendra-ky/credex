/**
 * Audit Engine Version
 * Single Responsibility: Single source of truth for the current rule engine version.
 *
 * HOW TO TRIGGER A RE-AUDIT:
 * 1. Update the audit rules in src/features/audit/rules/
 * 2. Bump this version string (semver)
 * 3. Commit and push to main
 *
 * The GitHub Actions workflow (.github/workflows/reaudit.yml) watches this file.
 * When it changes, it automatically runs scripts/run-reaudit.ts which re-audits
 * all leads whose latest audit was produced on an older version.
 */
export const AUDIT_ENGINE_VERSION = '1.0.0';
