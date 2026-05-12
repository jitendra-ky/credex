import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowRight, Check, Code, Bot, MessagesSquare, Sparkles, Terminal, GitBranch, Cpu, BrainCircuit } from 'lucide-react';
import { ValidatedAuditRequest } from '@/lib/validators';

interface MultiStepFormProps {
  onSubmit: (data: ValidatedAuditRequest) => void;
}

const AVAILABLE_TOOLS = [
  { id: 'cursor', name: 'Cursor', icon: Terminal, color: 'bg-black', isApi: false },
  { id: 'github_copilot', name: 'GitHub Copilot', icon: GitBranch, color: 'bg-[#24292f]', isApi: false },
  { id: 'claude_gui', name: 'Claude', icon: Bot, color: 'bg-[#D97757]', isApi: false },
  { id: 'chatgpt_gui', name: 'ChatGPT', icon: MessagesSquare, color: 'bg-[#10A37F]', isApi: false },
  { id: 'gemini', name: 'Gemini', icon: Sparkles, color: 'bg-blue-500', isApi: false },
  { id: 'v0_vercel', name: 'v0 (Vercel)', icon: Code, color: 'bg-black', isApi: false },
  { id: 'anthropic_api', name: 'Anthropic API', icon: Cpu, color: 'bg-[#D97757]', isApi: true },
  { id: 'openai_api', name: 'OpenAI API', icon: BrainCircuit, color: 'bg-[#10A37F]', isApi: true },
];

const TOOL_PLAN_OPTIONS: Record<string, { label: string; value: string }[]> = {
  cursor: [
    { label: 'Hobby (Free)', value: 'hobby' },
    { label: 'Pro', value: 'pro' },
    { label: 'Pro+', value: 'pro_plus' },
    { label: 'Ultra', value: 'ultra' },
    { label: 'Business', value: 'business' },
    { label: 'Enterprise', value: 'enterprise' },
  ],
  // GitHub Copilot — prices verified May 2026 from github.com/features/copilot
  // Free: $0 | Pro: $10/mo | Pro+: $39/mo | Business: $19/user/mo | Enterprise: $39/user/mo
  github_copilot: [
    { label: 'Free ($0)', value: 'free' },
    { label: 'Pro ($10/mo)', value: 'pro' },
    { label: 'Pro+ ($39/mo)', value: 'pro_plus' },
    { label: 'Business ($19/user/mo)', value: 'business' },
    { label: 'Enterprise ($39/user/mo)', value: 'enterprise' },
  ],
  claude_gui: [
    { label: 'Free', value: 'free' },
    { label: 'Pro', value: 'pro' },
    { label: 'Max 5x', value: 'max_5x' },
    { label: 'Max 20x', value: 'max_20x' },
    { label: 'Team Standard', value: 'team_standard' },
    { label: 'Team Premium', value: 'team_premium' },
    { label: 'Enterprise', value: 'enterprise' },
  ],
  chatgpt_gui: [
    { label: 'Free', value: 'free' },
    { label: 'Go', value: 'go' },
    { label: 'Plus', value: 'plus' },
    { label: 'Pro ($100)', value: 'pro_100' },
    { label: 'Pro ($200)', value: 'pro_200' },
    { label: 'Business', value: 'business' },
    { label: 'Enterprise', value: 'enterprise' },
  ],
  gemini: [
    { label: 'Free', value: 'free' },
    { label: 'Plus', value: 'plus' },
    { label: 'Pro', value: 'pro' },
    { label: 'Ultra', value: 'ultra' },
    { label: 'Business', value: 'business' },
    { label: 'Enterprise Standard', value: 'enterprise_standard' },
    { label: 'Enterprise Plus', value: 'enterprise_plus' },
  ],
  v0_vercel: [
    { label: 'Free', value: 'free' },
    { label: 'Premium', value: 'premium' },
    { label: 'Team', value: 'team' },
    { label: 'Business', value: 'business' },
    { label: 'Enterprise', value: 'enterprise' },
  ],
  // API tools use model + token volume fields instead of plan options
  anthropic_api: [
    { label: 'Claude Haiku', value: 'haiku' },
    { label: 'Claude Sonnet', value: 'sonnet' },
    { label: 'Claude Opus', value: 'opus' },
  ],
  openai_api: [
    { label: 'GPT-5.4 Mini', value: 'gpt_5_4_mini' },
    { label: 'GPT-5.4', value: 'gpt_5_4' },
    { label: 'GPT-5.5', value: 'gpt_5_5' },
  ],
};

const INITIAL_GLOBAL_CONTEXT = {
  total_team_size: 10,
  primary_use_case: 'coding',
  saml_sso_required: false,
  scim_automated_provisioning_required: false,
  strict_data_privacy_no_training_required: false,
};

export function MultiStepForm({ onSubmit }: MultiStepFormProps) {
  const [step, setStep] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  
  // Simplified state for demonstration. In a real app, use React Hook Form with Zod.
  const [toolDetails, setToolDetails] = useState<Record<string, any>>({});
  const [globalContext, setGlobalContext] = useState(INITIAL_GLOBAL_CONTEXT);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('credex_form_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedTools(parsed.selectedTools || []);
        setToolDetails(parsed.toolDetails || {});
        setGlobalContext(parsed.globalContext || INITIAL_GLOBAL_CONTEXT);
      } catch (e) {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('credex_form_state', JSON.stringify({ selectedTools, toolDetails, globalContext }));
  }, [selectedTools, toolDetails, globalContext]);

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleToolDetailChange = (toolId: string, field: string, value: any) => {
    setToolDetails(prev => ({
      ...prev,
      [toolId]: { ...prev[toolId], [field]: value }
    }));
  };

  const handleSubmit = () => {
    const API_TOOLS = ['anthropic_api', 'openai_api'];

    const payload: any = {
      global_context: {
        total_team_size: Number(globalContext.total_team_size),
        primary_use_case: globalContext.primary_use_case,
        security_requirements: {
          saml_sso_required: globalContext.saml_sso_required,
          scim_automated_provisioning_required: globalContext.scim_automated_provisioning_required,
          strict_data_privacy_no_training_required: globalContext.strict_data_privacy_no_training_required
        }
      },
      current_stack: {
        cursor: { is_active: false, current_monthly_spend_usd: 0, current_plan: 'pro', number_of_seats: 0, billing_cycle: 'monthly' },
        github_copilot: { is_active: false, current_monthly_spend_usd: 0, current_plan: 'business', number_of_seats: 0, billing_cycle: 'monthly' },
        claude_gui: { is_active: false, current_monthly_spend_usd: 0, current_plan: 'pro', number_of_seats: 0, billing_cycle: 'monthly' },
        chatgpt_gui: { is_active: false, current_monthly_spend_usd: 0, current_plan: 'free', number_of_seats: 0, billing_cycle: 'monthly' },
        gemini: { is_active: false, current_monthly_spend_usd: 0, current_plan: 'free', number_of_seats: 0, billing_cycle: 'monthly' },
        v0_vercel: { is_active: false, current_monthly_spend_usd: 0, current_plan: 'free', number_of_seats: 0, has_vercel_pro_infrastructure_active: false },
        anthropic_api: { is_active: false, current_monthly_spend_usd: 0, primary_model_used: 'sonnet', average_monthly_token_volume_millions: 0, is_workload_asynchronous: false, requires_us_data_residency: false },
        openai_api: { is_active: false, current_monthly_spend_usd: 0, primary_model_used: 'gpt_5_4', average_monthly_token_volume_millions: 0, is_workload_asynchronous: false, requires_us_data_residency: false },
      }
    };

    selectedTools.forEach(toolId => {
      const details = toolDetails[toolId] || {};

      if (API_TOOLS.includes(toolId)) {
        // API tools have different fields
        const defaultModel = toolId === 'anthropic_api' ? 'sonnet' : 'gpt_5_4';
        payload.current_stack[toolId] = {
          is_active: true,
          current_monthly_spend_usd: Number(details.cost || 0),
          primary_model_used: details.model || defaultModel,
          average_monthly_token_volume_millions: Number(details.token_volume || 1),
          is_workload_asynchronous: Boolean(details.is_async),
          requires_us_data_residency: Boolean(details.requires_us_residency),
        };
      } else {
        const defaultPlan = TOOL_PLAN_OPTIONS[toolId]?.[1]?.value || 'pro';
        const seats = Number(details.seats || 1);
        const plan = details.plan || defaultPlan;
        const cost = Number(details.cost || 20) * seats;

        payload.current_stack[toolId] = {
          is_active: true,
          current_monthly_spend_usd: cost,
          current_plan: plan,
          number_of_seats: seats,
          billing_cycle: details.billing_cycle || 'monthly',
          ...(toolId === 'v0_vercel' ? { has_vercel_pro_infrastructure_active: false } : {}),
        };
      }
    });

    onSubmit(payload as ValidatedAuditRequest);
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-center relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200" />
        {[1, 2, 3].map(i => (
          <div key={i} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm ${step >= i ? 'bg-deep-navy text-white' : 'bg-slate-200 text-slate-500'}`}>
            {i}
          </div>
        ))}
      </div>

      <Card className="shadow-lg border-sky-blue/20">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold text-deep-navy mb-2">What tools does your team use?</h2>
                <p className="text-muted-foreground">Select all the AI subscriptions you currently pay for.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVAILABLE_TOOLS.map(tool => {
                  const ToolIcon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolToggle(tool.id)}
                      className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                        selectedTools.includes(tool.id) 
                          ? 'border-brand-DEFAULT bg-brand-light text-brand-dark' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      {selectedTools.includes(tool.id) && (
                        <div className="absolute top-2 right-2 text-brand-DEFAULT">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      {tool.isApi && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-bold bg-slate-700 text-white rounded px-1 py-0.5 leading-none">API</span>
                        </div>
                      )}
                      <div className={`p-3 rounded-lg text-white ${tool.color}`}>
                        <ToolIcon className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-xs text-center leading-tight">{tool.name}</span>
                    </button>
                  );
                })}
              </div>
              <Button 
                className="w-full mt-6" 
                size="lg" 
                onClick={() => setStep(2)}
                disabled={selectedTools.length === 0}
              >
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold text-deep-navy mb-2">Enter Plan Details</h2>
                <p className="text-muted-foreground">Help us understand your current tier and seat counts.</p>
              </div>
              <div className="space-y-6">
                {selectedTools.map(toolId => {
                  const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
                  if (!tool) return null;
                  const Icon = tool.icon;
                  return (
                    <div key={toolId} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Icon className="w-5 h-5 text-deep-navy" />
                        <h3 className="font-semibold text-deep-navy">{tool.name}</h3>
                        {tool.isApi && (
                          <span className="text-xs font-bold bg-slate-700 text-white rounded px-1.5 py-0.5">API Direct</span>
                        )}
                      </div>

                      {tool.isApi ? (
                        /* API Tool fields: model, spend, token volume, async, residency */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Model</label>
                            <Select
                              options={TOOL_PLAN_OPTIONS[toolId] || []}
                              value={toolDetails[toolId]?.model || (toolId === 'anthropic_api' ? 'sonnet' : 'gpt_5_4')}
                              onChange={e => handleToolDetailChange(toolId, 'model', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Monthly Spend ($)</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g. 500"
                              value={toolDetails[toolId]?.cost || ''}
                              onChange={e => handleToolDetailChange(toolId, 'cost', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Avg Monthly Tokens (millions)</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="e.g. 50"
                              value={toolDetails[toolId]?.token_volume || ''}
                              onChange={e => handleToolDetailChange(toolId, 'token_volume', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 col-span-full">
                            <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={Boolean(toolDetails[toolId]?.is_async)}
                                onChange={e => handleToolDetailChange(toolId, 'is_async', e.target.checked)}
                              />
                              <span>Workload is asynchronous / batch-compatible (unlocks 50% Batch API discount)</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={Boolean(toolDetails[toolId]?.requires_us_residency)}
                                onChange={e => handleToolDetailChange(toolId, 'requires_us_residency', e.target.checked)}
                              />
                              <span>Requires US data residency (10% compliance uplift)</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        /* Standard GUI tool fields: plan, seats, cost/seat, billing */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Plan</label>
                            <Select 
                              options={TOOL_PLAN_OPTIONS[toolId] || [
                                { label: 'Pro', value: 'pro' },
                                { label: 'Business', value: 'business' },
                                { label: 'Enterprise', value: 'enterprise' },
                              ]}
                              value={toolDetails[toolId]?.plan || 'pro'}
                              onChange={e => handleToolDetailChange(toolId, 'plan', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Seats / Licenses</label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={toolDetails[toolId]?.seats || 1}
                              onChange={e => handleToolDetailChange(toolId, 'seats', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Cost per Seat ($)</label>
                            <Input 
                              type="number" 
                              min="0" 
                              value={toolDetails[toolId]?.cost || 20}
                              onChange={e => handleToolDetailChange(toolId, 'cost', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Billing</label>
                            <Select 
                              options={[
                                { label: 'Monthly', value: 'monthly' },
                                { label: 'Annual', value: 'annual' }
                              ]}
                              value={toolDetails[toolId]?.billing_cycle || 'monthly'}
                              onChange={e => handleToolDetailChange(toolId, 'billing_cycle', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="w-1/3" onClick={() => setStep(1)}>Back</Button>
                <Button className="w-2/3" onClick={() => setStep(3)}>Continue <ArrowRight className="ml-2 w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold text-deep-navy mb-2">Team Context</h2>
                <p className="text-muted-foreground">To provide accurate recommendations, we need a little context about your team.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-deep-navy">Total Team Size</label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={globalContext.total_team_size}
                    onChange={e => setGlobalContext(prev => ({...prev, total_team_size: Number(e.target.value)}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-deep-navy">Primary Use Case</label>
                  <Select 
                    options={[
                      { label: 'Software Engineering (Coding)', value: 'coding' },
                      { label: 'Content & Writing', value: 'writing' },
                      { label: 'Data Analysis', value: 'data_analysis' },
                      { label: 'Research', value: 'research' },
                      { label: 'Mixed / General', value: 'mixed_general' },
                    ]}
                    value={globalContext.primary_use_case}
                    onChange={e => setGlobalContext(prev => ({...prev, primary_use_case: e.target.value}))}
                  />
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h4 className="font-medium text-sm mb-3">Security Requirements</h4>
                  <label className="flex items-center space-x-2 text-sm text-slate-600 mb-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-brand-DEFAULT focus:ring-brand-DEFAULT" 
                      checked={globalContext.saml_sso_required}
                      onChange={e => setGlobalContext(prev => ({...prev, saml_sso_required: e.target.checked}))}
                    />
                    <span>SAML SSO Required</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600 mb-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-brand-DEFAULT focus:ring-brand-DEFAULT" 
                      checked={globalContext.strict_data_privacy_no_training_required}
                      onChange={e => setGlobalContext(prev => ({...prev, strict_data_privacy_no_training_required: e.target.checked}))}
                    />
                    <span>Strict Data Privacy (Zero Data Retention/Training)</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="w-1/3" onClick={() => setStep(2)}>Back</Button>
                <Button className="w-2/3 bg-brand-DEFAULT hover:bg-brand-dark text-white" onClick={handleSubmit}>
                  Analyze My Spend <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
