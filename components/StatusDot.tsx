type StatusType = 'in-development' | 'live';

interface StatusDotProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  'in-development': {
    color: 'bg-slate-blue',
    label: 'In Development',
    pulseColor: 'bg-slate-blue/50',
  },
  live: {
    color: 'bg-green-500',
    label: 'Live',
    pulseColor: 'bg-green-500/50',
  },
};

export default function StatusDot({ status, className = '' }: StatusDotProps) {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full ${config.color} z-10`} />
        <div
          className={`absolute w-2 h-2 rounded-full ${config.pulseColor} animate-ping`}
        />
      </div>
      <span className="font-mono text-xs tracking-wider uppercase text-ash">
        {config.label}
      </span>
    </div>
  );
}
