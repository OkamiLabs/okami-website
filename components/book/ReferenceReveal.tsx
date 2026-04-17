'use client';

import { useEffect, useState } from 'react';

interface ReferenceRevealProps {
  reference: string;
  /** ms per character */
  speed?: number;
}

/**
 * Typewriter reveal for the booking reference. One detail that earns motion
 * on the confirmation page. Honors prefers-reduced-motion — falls straight
 * to the fully-revealed state.
 */
export default function ReferenceReveal({ reference, speed = 55 }: ReferenceRevealProps) {
  const [visible, setVisible] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(reference);
      return;
    }
    setVisible('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisible(reference.slice(0, i));
      if (i >= reference.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [reference, speed]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="inline-flex items-baseline gap-5">
      <span className="font-mono text-2xl md:text-3xl text-off-white tabular-nums tracking-[0.08em]">
        {visible || '\u00a0'}
        <span className="ml-0.5 inline-block w-[1ch] h-[1em] align-baseline" aria-hidden>
          <span
            className={`inline-block w-full h-full bg-burgundy/70 ${
              visible.length < reference.length ? 'animate-pulse' : 'opacity-0'
            }`}
          />
        </span>
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash hover:text-off-white transition-colors"
        aria-label="Copy reference number"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
