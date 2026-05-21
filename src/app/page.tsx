'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LandingHero } from '@/features/audit/components/LandingHero';
import { MultiStepForm } from '@/features/audit/components/MultiStepForm';
import { ProcessingState } from '@/features/audit/components/ProcessingState';
import { AuditDashboard } from '@/features/audit/components/AuditDashboard';
import { ShareAudit } from '@/features/audit/components/ShareAudit';
import { LeadCaptureModal } from '@/features/leads/components/LeadCaptureModal';
import { ValidatedAuditRequest } from '@/lib/validators';

type AppState = 'landing' | 'form' | 'processing' | 'results' | 'error';

interface AuditResults {
  audit_id: string;
  findings: any[];
  total_monthly_savings_usd: number;
  total_annual_savings_usd: number;
  audit_tag: string;
  ai_summary: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const router = useRouter();

  const handleStartForm = () => setAppState('form');

  const handleSubmitForm = async (data: ValidatedAuditRequest) => {
    setAppState('processing');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setAuditResults(result.data);
        setAppState('results');
        // Show lead modal after 4 seconds — only if user hasn't already submitted
        const alreadyCaptured = typeof window !== 'undefined'
          && localStorage.getItem('credex_lead_captured');
        if (!alreadyCaptured) {
          setTimeout(() => setShowLeadModal(true), 4000);
        }
      } else {
        const errMsg = result.error?.message || 'Validation failed. Please check your inputs.';
        setErrorMessage(errMsg);
        setAppState('error');
      }
    } catch (error) {
      console.error('Audit failed:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
      setAppState('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand-DEFAULT selection:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setAppState('landing'); setErrorMessage(''); }}>
            <div className="w-8 h-8 bg-deep-navy rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-deep-navy">Credex</span>
          </div>
        </header>

        {appState === 'landing' && <LandingHero onStart={handleStartForm} />}
        {appState === 'form' && <MultiStepForm onSubmit={handleSubmitForm} />}
        {appState === 'processing' && <ProcessingState />}

        {appState === 'error' && (
          <div className="max-w-xl mx-auto text-center py-20 space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-deep-navy">Something went wrong</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <button
              onClick={() => setAppState('form')}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-brand-DEFAULT text-white hover:bg-brand-dark transition-colors font-medium"
            >
              ← Try Again
            </button>
          </div>
        )}

        {appState === 'results' && auditResults && (
          <div className="space-y-8">
            <AuditDashboard results={{
              audit_id: auditResults.audit_id,
              total_annual_savings_usd: auditResults.total_annual_savings_usd,
              total_monthly_savings_usd: auditResults.total_monthly_savings_usd,
              findings: auditResults.findings,
              ai_summary: auditResults.ai_summary,
            }} />
            <ShareAudit auditId={auditResults.audit_id} />

            {showLeadModal && (
              <LeadCaptureModal
                auditId={auditResults.audit_id}
                onClose={() => setShowLeadModal(false)}
                onSuccess={() => setShowLeadModal(false)}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
