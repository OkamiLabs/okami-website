import type { ReactNode } from 'react';

type AsideAccent = 'burgundy' | 'slate-blue' | 'ash';

interface AsideProps {
  label: string;
  children: ReactNode;
  closer?: string;
  accent?: AsideAccent;
  className?: string;
}

const borderByAccent: Record<AsideAccent, string> = {
  burgundy: 'border-burgundy/40 bg-burgundy/[0.02]',
  'slate-blue': 'border-slate-blue/40 bg-slate-blue/[0.02]',
  ash: 'border-ash/30 bg-ash/[0.02]',
};

const labelByAccent: Record<AsideAccent, string> = {
  burgundy: 'text-burgundy/80',
  'slate-blue': 'text-slate-blue/80',
  ash: 'text-ash/80',
};

export default function Aside({
  label,
  children,
  closer,
  accent = 'burgundy',
  className = '',
}: AsideProps) {
  return (
    <aside
      className={`border-l-2 pl-6 py-2 ${borderByAccent[accent]} ${className}`}
    >
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.2em] block mb-3 ${labelByAccent[accent]}`}
      >
        {label}
      </span>
      <div className="space-y-3 [&_p]:font-body [&_p]:text-base [&_p]:leading-[1.8] [&_p]:text-ash">
        {children}
      </div>
      {closer && (
        <p className="mt-3 font-playfair text-base text-off-white/80 italic">
          {closer}
        </p>
      )}
    </aside>
  );
}
