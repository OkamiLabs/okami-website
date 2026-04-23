'use client';

import { useEffect, useRef } from 'react';
import Button from './Button';

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) requestAnimationFrame(() => el.classList.add('hero-playing'));
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Atmosphere: dual radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 85% at 50% 50%, rgba(139,58,58,0.045) 0%, rgba(104,120,160,0.04) 40%, transparent 70%)',
        }}
      />
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div className="hero-eyebrow flex items-center gap-3 mb-9 font-mono text-xs tracking-[0.32em] uppercase text-off-white">
          <span className="block w-5 h-px bg-off-white/25" />
          Okami
          <span className="block w-5 h-px bg-off-white/25" />
        </div>

        {/* Headline */}
        <h1 className="hero-headline font-playfair text-5xl md:text-7xl lg:text-8xl text-off-white leading-[1.1] tracking-[0.04em] uppercase max-w-5xl">
          The Silent Giant
          <br />
          Behind Modern Business
        </h1>

        {/* Subheading */}
        <p className="hero-subhead mt-10 max-w-2xl font-body text-base md:text-lg leading-relaxed text-ash">
          Operations consulting and automation for businesses ready to fix what&apos;s
          underneath before adding what&apos;s on top.
        </p>

        {/* CTA */}
        <div className="hero-cta mt-[44px]">
          <Button href="/book" variant="primary">
            Book your Review
          </Button>
        </div>
      </div>
    </section>
  );
}
