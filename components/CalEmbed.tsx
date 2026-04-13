'use client';

import { useEffect, useRef } from 'react';
import { bootstrapCal } from '@/lib/cal';

const DEFAULT_CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK || '';

let instanceCounter = 0;

interface CalEmbedProps {
  calLink?: string;
  className?: string;
}

export default function CalEmbed({ calLink = DEFAULT_CAL_LINK, className = '' }: CalEmbedProps) {
  const elementIdRef = useRef<string | null>(null);
  if (elementIdRef.current === null) {
    elementIdRef.current = `cal-embed-${++instanceCounter}`;
  }
  const elementId = elementIdRef.current;

  useEffect(() => {
    if (!calLink) return;

    const normalizedLink = calLink.replace(/^https?:\/\/cal\.com\//, '');

    bootstrapCal();

    window.Cal('inline', {
      elementOrSelector: `#${elementId}`,
      calLink: normalizedLink,
      config: { layout: 'month_view' },
    });

    window.Cal('ui', {
      theme: 'dark',
      hideEventTypeDetails: false,
      layout: 'month_view',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calLink]);

  const directLink = calLink.startsWith('http') ? calLink : `https://cal.com/${calLink}`;

  return (
    <div className={`w-full ${className}`}>
      {calLink ? (
        <div id={elementId} style={{ width: '100%', height: '700px' }} />
      ) : null}

      <div className="mt-6 text-center">
        <p className="font-mono text-xs text-ash">
          {calLink ? (
            <>
              Calendar not loading?{' '}
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-off-white underline underline-offset-4 hover:text-off-white/80 transition-colors"
              >
                Book directly on Cal.com
              </a>
            </>
          ) : (
            <span className="text-ash/60">Booking calendar coming soon.</span>
          )}
        </p>
      </div>
    </div>
  );
}
