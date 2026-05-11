import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Mail } from 'lucide-react';

interface LeadCaptureModalProps {
  auditId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeadCaptureModal({ auditId, onClose, onSuccess }: LeadCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company_name: company, audit_id: auditId })
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <div className="h-2 w-full bg-brand-DEFAULT rounded-t-xl" />
        </div>
        <CardContent className="p-8">
          <div className="w-12 h-12 bg-sky-blue/20 rounded-full flex items-center justify-center mb-4 text-brand-DEFAULT">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-deep-navy mb-2">Want a custom consultation?</h2>
          <p className="text-muted-foreground mb-6">
            Get a PDF of this report and let our experts help you secure these savings via Credex credits.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Work Email</label>
              <Input 
                type="email" 
                placeholder="you@company.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input 
                type="text" 
                placeholder="Acme Corp" 
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-deep-navy hover:bg-navy-light text-white" disabled={loading}>
              {loading ? 'Sending...' : 'Send My Report'}
            </Button>
            <p className="text-xs text-center text-slate-400 mt-4">We respect your inbox. No spam.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
