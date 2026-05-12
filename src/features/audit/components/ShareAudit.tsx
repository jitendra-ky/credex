'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Share2, Check, Loader2 } from 'lucide-react';

interface ShareAuditProps {
  auditId: string;
}

export function ShareAudit({ auditId }: ShareAuditProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async () => {
    setLoading(true);
    setError('');

    try {
      // Call API to mark audit as shared
      const response = await fetch(`/api/audits/${auditId}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      // Build share URL with audit UUID
      const shareUrl = `${window.location.origin}/share/${auditId}`;
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
      <span className="font-medium text-deep-navy">Share this audit:</span>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleShare} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          {loading ? 'Sharing...' : copied ? 'Copied URL' : 'Copy Link'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
