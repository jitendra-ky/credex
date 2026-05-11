'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Share2, Check, ExternalLink } from 'lucide-react';

interface ShareAuditProps {
  auditId: string;
}

export function ShareAudit({ auditId }: ShareAuditProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${auditId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent("I just audited my team's AI spend and found massive savings. Check out my stack's efficiency score:");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
      <span className="font-medium text-deep-navy">Share this audit:</span>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Copied URL' : 'Copy Link'}
        </Button>
        <Button variant="outline" onClick={handleTwitterShare} className="gap-2 text-sky-500 hover:text-sky-600 hover:bg-sky-50">
          <ExternalLink className="w-4 h-4" />
          Twitter
        </Button>
        <Button variant="outline" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}>
          <ExternalLink className="w-4 h-4" />
          LinkedIn
        </Button>
      </div>
    </div>
  );
}
