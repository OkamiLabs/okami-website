'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) requestAnimationFrame(() => el.classList.add('hero-playing'));
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 lg:px-8 relative overflow-hidden"
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

        {/* CTA */}
        <div className="hero-cta mt-[52px]">
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-3 px-[22px] py-3 font-mono text-sm tracking-[0.18em] uppercase text-off-white"
          >
            <span className="absolute top-0 left-0 w-[10px] h-[10px] border-t border-l border-off-white/50 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-off-white/90" />
            <span className="absolute bottom-0 right-0 w-[10px] h-[10px] border-b border-r border-off-white/50 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-off-white/90" />
            Book a Consultation
            <span className="text-ash transition-transform duration-300 group-hover:translate-x-1 group-hover:text-off-white">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
