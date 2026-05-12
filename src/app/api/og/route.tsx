/**
 * GET /api/og?monthly=<number>&annual=<number>
 * Dynamic Open Graph image for shareable audit URLs.
 * Renders a 1200×630 branded card with savings summary.
 *
 * Assignment §6: "Open Graph tags for clean link previews (Twitter card too)"
 *
 * Architecture note:
 * - Runs on the Edge runtime so @vercel/og works correctly.
 * - Savings data is passed as query params from generateMetadata in share/[id]/page.tsx.
 *   This avoids importing pg (incompatible with edge runtime) and avoids a second DB hit.
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const monthly = Number(searchParams.get('monthly') ?? 0);
  const annual = Number(searchParams.get('annual') ?? 0);
  const found = annual > 0 || monthly > 0;

  const savingsLabel = found
    ? `$${annual.toLocaleString('en-US')}/yr in AI savings found`
    : 'Audit your AI spend for free';

  const subLabel = found
    ? `$${monthly.toLocaleString('en-US')}/mo in potential savings — run your own audit`
    : 'Cursor · Copilot · Claude · ChatGPT · and more';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0e7490 100%)',
          fontFamily: 'sans-serif',
          padding: '72px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent circle */}
        <div
          style={{
            position: 'absolute',
            right: '-120px',
            top: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Brand badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#0f172a', fontSize: '20px', fontWeight: 900 }}>C</span>
          </div>
          <span
            style={{
              color: '#94a3b8',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            CREDEX · AI SPEND AUDIT
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#f1f5f9',
            lineHeight: 1.1,
            maxWidth: '880px',
            marginBottom: '24px',
          }}
        >
          {savingsLabel}
        </div>

        {/* Sub label */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            fontWeight: 400,
            maxWidth: '800px',
          }}
        >
          {subLabel}
        </div>

        {/* Bottom CTA strip */}
        <div
          style={{
            position: 'absolute',
            bottom: '56px',
            left: '80px',
            right: '80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#475569', fontSize: '20px' }}>credex.rocks</span>
          <div
            style={{
              background: '#06b6d4',
              color: '#0f172a',
              borderRadius: '9999px',
              padding: '12px 32px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Audit for free →
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
