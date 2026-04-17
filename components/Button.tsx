import Link from 'next/link';

type ButtonVariant = 'primary' | 'consulting' | 'labs' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

interface ButtonProps {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  showArrow?: boolean;
  disabled?: boolean;
}

const sizeStyles = {
  sm: 'px-5 py-2.5 text-xs tracking-[0.16em]',
  default: 'px-[22px] py-3 text-sm tracking-[0.18em]',
  lg: 'px-8 py-4 text-sm tracking-[0.2em]',
} as const;

const cornerSizeMap = {
  sm: { base: 'w-2 h-2', hover: 'group-hover:w-3 group-hover:h-3' },
  default: { base: 'w-[10px] h-[10px]', hover: 'group-hover:w-4 group-hover:h-4' },
  lg: { base: 'w-3 h-3', hover: 'group-hover:w-5 group-hover:h-5' },
} as const;

const variantCornerColors = {
  primary: 'border-off-white/50 group-hover:border-off-white/90',
  consulting: 'border-burgundy/50 group-hover:border-burgundy',
  labs: 'border-slate-blue/50 group-hover:border-slate-blue',
  ghost: 'border-ash/40 group-hover:border-ash/80',
} as const;

const variantTextColors = {
  primary: 'text-off-white',
  consulting: 'text-off-white',
  labs: 'text-off-white',
  ghost: 'text-ash group-hover:text-off-white',
} as const;

const variantArrowColors = {
  primary: 'text-ash group-hover:text-off-white',
  consulting: 'text-burgundy/60 group-hover:text-burgundy',
  labs: 'text-slate-blue/60 group-hover:text-slate-blue',
  ghost: 'text-ash/50 group-hover:text-ash',
} as const;

export default function Button({
  href,
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  onClick,
  type = 'button',
  showArrow = true,
  disabled = false,
}: ButtonProps) {
  const corners = cornerSizeMap[size];
  const cornerColor = variantCornerColors[variant];
  const textColor = variantTextColors[variant];
  const arrowColor = variantArrowColors[variant];

  const inner = (
    <>
      {/* Top-left corner bracket */}
      <span
        className={`absolute top-0 left-0 ${corners.base} border-t border-l ${cornerColor} ${corners.hover} transition-all duration-300`}
      />
      {/* Bottom-right corner bracket */}
      <span
        className={`absolute bottom-0 right-0 ${corners.base} border-b border-r ${cornerColor} ${corners.hover} transition-all duration-300`}
      />
      {children}
      {showArrow && (
        <span
          className={`${arrowColor} transition-all duration-300 group-hover:translate-x-1`}
        >
          →
        </span>
      )}
    </>
  );

  const baseClassName = `group relative inline-flex items-center justify-center gap-3 font-mono uppercase ${sizeStyles[size]} ${textColor} transition-colors duration-300 ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClassName}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClassName}
    >
      {inner}
    </button>
  );
}
