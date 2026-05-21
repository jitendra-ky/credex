'use client';

/**
 * LeadCaptureModal
 * 3-step wizard: Details → OTP Verify → Success
 *
 * Step 1 — collects email, company, role → POST /api/leads/send-otp
 * Step 2 — 6-digit OTP input → POST /api/leads/verify-otp
 * Step 3 — success screen (auto-dismisses after 3 s)
 *
 * On any close/success: sets localStorage flag so modal never shows again.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, ShieldCheck, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { LeadResponse } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'credex_lead_captured';
const COOLDOWN_SECONDS = 300; // 5 min — matches server
const AUTO_DISMISS_MS = 3000;

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'details' | 'otp' | 'success';

interface LeadCaptureModalProps {
  auditId?: string;
  onClose: () => void;
  onSuccess?: (lead: LeadResponse) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // localStorage may be unavailable in some environments — safe to ignore
  }
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── OTP Input — 6 individual boxes ───────────────────────────────────────────

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(''));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={[
            'w-11 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all',
            'bg-white text-slate-900',
            digit
              ? 'border-brand-DEFAULT shadow-sm'
              : 'border-slate-200 focus:border-brand-DEFAULT',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LeadCaptureModal({ auditId, onClose, onSuccess }: LeadCaptureModalProps) {
  const [step, setStep] = useState<Step>('details');

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capturedLead, setCapturedLead] = useState<LeadResponse | null>(null);

  // ── Countdown timer (resend cooldown) ──────────────────────────────────

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Auto-dismiss on success ────────────────────────────────────────────

  useEffect(() => {
    if (step !== 'success') return;
    const t = setTimeout(() => {
      persist();
      onClose();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [step, onClose]);

  // ── Close handler (sets localStorage) ────────────────────────────────

  const handleClose = useCallback(() => {
    persist();
    onClose();
  }, [onClose]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setCountdown(data.cooldown_seconds ?? COOLDOWN_SECONDS);
        setStep('otp');
      } else {
        const code = data.error?.code;
        if (code === 'OTP_COOLDOWN') {
          const secs = data.error?.details?.retry_after_seconds ?? COOLDOWN_SECONDS;
          setError(`A code was already sent. Please wait ${Math.ceil(secs / 60)} min.`);
        } else {
          setError(data.error?.message ?? 'Something went wrong. Please try again.');
        }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp_code: otp,
          company_name: company || null,
          role: role || null,
          audit_id: auditId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCapturedLead(data.data);
        onSuccess?.(data.data);
        setStep('success');
      } else {
        const code = data.error?.code;
        if (code === 'OTP_INVALID') {
          const remaining = data.error?.details?.attempts_remaining ?? 0;
          setError(
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
              : 'Incorrect code. No attempts remaining — please request a new code.',
          );
        } else if (code === 'OTP_EXPIRED') {
          setError('Code has expired. Click "Resend code" to get a new one.');
        } else if (code === 'OTP_LOCKED') {
          setError('Too many wrong attempts. Please request a new code below.');
        } else if (code === 'OTP_NOT_FOUND') {
          setError('No active code found. Please go back and resend.');
        } else {
          setError(data.error?.message ?? 'Something went wrong. Please try again.');
        }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Resend OTP ────────────────────────────────────────────────

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/leads/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setCountdown(data.cooldown_seconds ?? COOLDOWN_SECONDS);
      } else {
        setError(data.error?.message ?? 'Failed to resend. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Top accent bar + close button */}
        <div className="relative">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-DEFAULT to-blue-500 rounded-t-xl" />
          {step !== 'success' && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <CardContent className="p-8">

          {/* ── STEP 1: Details ───────────────────────────────────────── */}
          {step === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-brand-DEFAULT shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-deep-navy leading-tight">
                    Get your free consultation
                  </h2>
                  <p className="text-sm text-slate-500">
                    Our team will help you lock in these savings.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Company Name
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <Input
                  id="lead-company"
                  type="text"
                  placeholder="Acme Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Job Title
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <Input
                  id="lead-role"
                  type="text"
                  placeholder="Engineering Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-deep-navy hover:bg-navy-light text-white h-11"
                disabled={loading || !email}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending code…
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </Button>

              <p className="text-xs text-center text-slate-400">
                We respect your inbox. No spam, ever.
              </p>
            </form>
          )}

          {/* ── STEP 2: OTP ──────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-brand-DEFAULT shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-deep-navy leading-tight">
                    Check your inbox
                  </h2>
                  <p className="text-sm text-slate-500">
                    We sent a 6-digit code to
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setOtp(''); setError(''); }}
                  className="text-xs text-brand-DEFAULT hover:underline shrink-0"
                >
                  ← Change
                </button>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-deep-navy hover:bg-navy-light text-white h-11"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  'Verify Code'
                )}
              </Button>

              {/* Resend row */}
              <div className="text-center text-sm text-slate-500">
                {countdown > 0 ? (
                  <span>
                    Resend in{' '}
                    <span className="font-mono font-semibold text-slate-700">
                      {formatCountdown(countdown)}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="flex items-center gap-1.5 mx-auto text-brand-DEFAULT hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 3: Success ───────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-deep-navy">
                  {capturedLead?.is_new ? "You're in!" : 'Welcome back!'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {capturedLead?.is_new
                    ? `Our team will reach out to ${email} within 24 hours.`
                    : `We've updated your details. Our team will be in touch soon.`}
                </p>
              </div>

              <p className="text-xs text-slate-400">This window will close automatically…</p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
