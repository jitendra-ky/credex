'use client';

import { Card } from '@/components/ui';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between gap-16 px-6 py-8 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-300">Credex</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Audit your AI spend</h1>
          </div>
          <a
            href="/audit"
            className="rounded-full border border-white/10 hover:bg-white/10 px-4 py-2 text-sm font-medium text-white transition"
          >
            Start free audit
          </a>
        </header>

        {/* Hero Section */}
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">
              ✨ Find overspend in 60 seconds
            </p>
            <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl leading-tight">
              Stop overpaying for AI tools.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Credex reviews your stack, highlights waste, and returns a clean savings report you can share internally.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/audit"
                className="rounded-full bg-sky-400 hover:bg-sky-300 px-6 py-3 text-sm font-semibold text-slate-950 transition"
              >
                Start free audit
              </a>
              <div className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-300 backdrop-blur">
                1,450,230 dollars saved tracked
              </div>
            </div>
          </div>

          {/* What we check card */}
          <Card className="shadow-2xl shadow-sky-950/30">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400">What we check</p>
            <div className="mt-6 space-y-3">
              {[
                'Plan mismatch and seat waste',
                'Cheaper tier opportunities',
                'API vs GUI economics',
                'Shareable summary output',
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 hover:bg-slate-900 transition"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
