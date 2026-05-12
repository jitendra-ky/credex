import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-700">
      <div className="inline-flex items-center rounded-full border border-sky-blue/30 bg-sky-blue/10 px-3 py-1 text-sm text-sky-blue mb-6">
        <span className="flex h-2 w-2 rounded-full bg-brand-DEFAULT mr-2"></span>
        $1,450,230 saved by users so far
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-deep-navy mb-6 max-w-4xl">
        Stop Overpaying for AI. <br className="hidden md:block" />
        <span className="text-brand-DEFAULT">Audit your stack in 60 seconds.</span>
      </h1>
      <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
        Discover hidden savings in your team&apos;s AI subscriptions. We analyze Cursor, GitHub Copilot, Claude, ChatGPT, Gemini, v0, and your Anthropic / OpenAI API spend to find the optimal setup.
      </p>
      <Button size="lg" onClick={onStart} className="rounded-full text-lg px-8 h-14 bg-deep-navy hover:bg-navy-light text-white transition-all shadow-lg hover:shadow-xl group">
        Start Free Audit
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}
