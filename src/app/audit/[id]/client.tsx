'use client';

import React, { useState, useEffect } from 'react';
import { LeadCaptureModal } from '@/features/leads/components/LeadCaptureModal';

export function AuditResultsClient({ auditId }: { auditId: string }) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Don't show if user already submitted in this browser
    try {
      if (localStorage.getItem('credex_lead_captured')) return;
    } catch {
      // localStorage unavailable — proceed anyway
    }

    // Show modal after 4 seconds (consistent with home page)
    const timer = setTimeout(() => setShowModal(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!showModal) return null;

  return (
    <LeadCaptureModal
      auditId={auditId}
      onClose={() => setShowModal(false)}
    />
  );
}
