'use client';

import React, { useState, useEffect } from 'react';
import { LeadCaptureModal } from '@/features/audit/components/LeadCaptureModal';

export function AuditResultsClient({ auditId }: { auditId: string }) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show modal after 3 seconds to let them read the hero stat
    const timer = setTimeout(() => setShowModal(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!showModal) return null;

  return (
    <LeadCaptureModal 
      auditId={auditId} 
      onClose={() => setShowModal(false)} 
      onSuccess={() => setShowModal(false)} 
    />
  );
}
