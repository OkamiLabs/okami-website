import Link from 'next/link';
import StatusDot from './StatusDot';

type CardAccent = 'slate-blue' | 'burgundy' | 'ash';
type StatusType = 'in-development' | 'live';

interface CardProps {
  tag: string;
  title: string;
  description: string;
  href?: string;
  linkText?: string;
  accent?: CardAccent;
  status?: StatusType;
  className?: string;
}

const accentStyles = {
  'slate-blue': 'bg-slate-blue/10 text-slate-blue border-slate-blue/20',
  burgundy: 'bg-burgundy/10 text-off-white border-burgundy/20',
  ash: 'bg-ash/10 text-ash border-ash/20',
};

const hoverAccentStyles = {
  'slate-blue': 'group-hover:border-slate-blue/30',
  burgundy: 'group-hover:border-burgundy/30',
  ash: 'group-hover:border-ash/30',
};

export default function Card({
  tag,
  title,
  description,
  href,
  linkText = 'Learn more',
  accent = 'ash',
  status,
  className = '',
}: CardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <span
          className={`inline-block px-4 py-2 font-mono text-xs tracking-widest uppercase border ${accentStyles[accent]}`}
        >
          {tag}
        </span>
        {status && <StatusDot status={status} />}
      </div>

      <h3 className="font-playfair text-2xl md:text-3xl text-off-white mb-4 group-hover:text-off-white/90 transition-colors">
        {title}
      </h3>

      <p className="font-body text-sm leading-relaxed text-ash">
        {description}
      </p>

      {href && (
        <div className="mt-6 flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-ash group-hover:text-off-white transition-colors">
          <span>{linkText}</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      )}
    </>
  );

  const baseStyles = `block p-8 border border-ash/10 bg-dark transition-colors duration-300 ${hoverAccentStyles[accent]} group ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return <div className={baseStyles}>{content}</div>;
}
