'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/client/api';
import { Button, Input, Select, Card, Alert, Spinner, SectionTitle, PageHeader } from '@/components/ui';
import type { AuditRequest } from '@/features/audit/types/audit.types';

const STORAGE_KEY = 'credex_audit_form';

const PLAN_OPTIONS: Record<string, string[]> = {
  cursor: ['hobby', 'pro', 'pro_plus', 'ultra', 'business', 'enterprise'],
  claude_gui: ['free', 'pro', 'max_5x', 'max_20x', 'team_standard', 'team_premium', 'enterprise'],
  chatgpt_gui: ['free', 'go', 'plus', 'pro_100', 'pro_200', 'business', 'enterprise'],
  gemini: ['free', 'plus', 'pro', 'ultra', 'business', 'enterprise_standard', 'enterprise_plus'],
  v0_vercel: ['free', 'premium', 'team', 'business', 'enterprise'],
  anthropic_api: [],
  openai_api: [],
};

function formatToolName(key: string): string {
  const names: Record<string, string> = {
    cursor: 'Cursor',
    claude_gui: 'Claude',
    chatgpt_gui: 'ChatGPT',
    gemini: 'Gemini',
    v0_vercel: 'v0',
    anthropic_api: 'Anthropic API',
    openai_api: 'OpenAI API',
  };
  return names[key] || key;
}

const DEFAULT_FORM_STATE: AuditRequest = {
  global_context: {
    total_team_size: 5,
    primary_use_case: 'coding',
    security_requirements: {
      saml_sso_required: false,
      scim_automated_provisioning_required: false,
      strict_data_privacy_no_training_required: false,
    },
  },
  current_stack: {
    cursor: {
      is_active: false,
      current_plan: 'pro',
      number_of_seats: 0,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 0,
    },
    claude_gui: {
      is_active: false,
      current_plan: 'pro',
      number_of_seats: 0,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 0,
    },
    chatgpt_gui: {
      is_active: false,
      current_plan: 'plus',
      number_of_seats: 0,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 0,
    },
    gemini: {
      is_active: false,
      current_plan: 'plus',
      number_of_seats: 0,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 0,
    },
    v0_vercel: {
      is_active: false,
      current_plan: 'premium',
      number_of_seats: 0,
      has_vercel_pro_infrastructure_active: false,
      current_monthly_spend_usd: 0,
    },
    anthropic_api: {
      is_active: false,
      primary_model_used: 'sonnet',
      average_monthly_token_volume_millions: 0,
      is_workload_asynchronous: false,
      requires_us_data_residency: false,
      current_monthly_spend_usd: 0,
    },
    openai_api: {
      is_active: false,
      primary_model_used: 'gpt_5_4',
      average_monthly_token_volume_millions: 0,
      is_workload_asynchronous: false,
      requires_us_data_residency: false,
      current_monthly_spend_usd: 0,
    },
  },
};

export default function AuditPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<AuditRequest>(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormState(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
    }
  }, [formState, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await clientApi.submitAudit(formState);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(`audit_${result.audit_id}`, JSON.stringify(result));
      router.push(`/audit/${result.audit_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
        <PageHeader title="Audit your AI spend" subtitle="Review your tools and spending to find savings." backLink="/" />

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Global Context */}
          <Card>
            <SectionTitle>Team information</SectionTitle>
            <div className="mt-4 space-y-4">
              <Input
                type="number"
                label="Team size"
                min="1"
                required
                value={formState.global_context.total_team_size}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    global_context: {
                      ...formState.global_context,
                      total_team_size: parseInt(e.target.value, 10) || 1,
                    },
                  })
                }
              />
              <Select
                label="Primary use case"
                value={formState.global_context.primary_use_case}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    global_context: {
                      ...formState.global_context,
                      primary_use_case: e.target.value as any,
                    },
                  })
                }
              >
                <option value="coding">Coding</option>
                <option value="writing">Writing</option>
                <option value="data_analysis">Data analysis</option>
                <option value="research">Research</option>
                <option value="mixed_general">Mixed general</option>
              </Select>
            </div>
          </Card>

          {/* Tools */}
          <div>
            <SectionTitle>AI tools in use</SectionTitle>
            <div className="mt-4 space-y-3">
              {Object.entries(formState.current_stack).map(([toolKey, tool]: [string, any]) => (
                <Card key={toolKey} className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={toolKey}
                      checked={tool.is_active}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          current_stack: {
                            ...formState.current_stack,
                            [toolKey]: { ...tool, is_active: e.target.checked },
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-white/10 bg-slate-900/50 accent-sky-400"
                    />
                    <label htmlFor={toolKey} className="text-sm font-medium text-slate-300">
                      {formatToolName(toolKey)}
                    </label>
                  </div>

                  {tool.is_active && (
                    <div className="space-y-3 pl-7 border-l border-white/10 pt-3">
                      {tool.current_plan && (
                        <Select
                          label="Plan"
                          value={tool.current_plan}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              current_stack: {
                                ...formState.current_stack,
                                [toolKey]: { ...tool, current_plan: e.target.value },
                              },
                            })
                          }
                        >
                          {PLAN_OPTIONS[toolKey]?.map((plan) => (
                            <option key={plan} value={plan}>
                              {plan}
                            </option>
                          ))}
                        </Select>
                      )}

                      {tool.number_of_seats !== undefined && (
                        <Input
                          type="number"
                          label="Number of seats"
                          min="1"
                          value={tool.number_of_seats || ''}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              current_stack: {
                                ...formState.current_stack,
                                [toolKey]: { ...tool, number_of_seats: parseInt(e.target.value, 10) || 0 },
                              },
                            })
                          }
                        />
                      )}

                      <Input
                        type="number"
                        label="Monthly spend (USD)"
                        min="0"
                        step="0.01"
                        value={tool.current_monthly_spend_usd || ''}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            current_stack: {
                              ...formState.current_stack,
                              [toolKey]: { ...tool, current_monthly_spend_usd: parseFloat(e.target.value) || 0 },
                            },
                          })
                        }
                      />

                      {tool.billing_cycle && (
                        <Select
                          label="Billing cycle"
                          value={tool.billing_cycle}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              current_stack: {
                                ...formState.current_stack,
                                [toolKey]: { ...tool, billing_cycle: e.target.value },
                              },
                            })
                          }
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </Select>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {error && <Alert type="error">{error}</Alert>}

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (
              <>
                <Spinner /> Analyzing...
              </>
            ) : (
              'Analyze my spend'
            )}
          </Button>
        </form>
      </section>
    </main>
  );
}

function getPlanOptions(toolKey: string): string[] {
  return PLAN_OPTIONS[toolKey] || [];
}
