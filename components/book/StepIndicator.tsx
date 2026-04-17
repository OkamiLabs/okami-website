'use client';

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStepId: string;
  completedStepIds: string[];
  /**
   * When provided, completed step labels render as buttons that call this
   * callback with the step id. Upcoming and active steps remain non-interactive.
   */
  onStepClick?: (stepId: string) => void;
}

/**
 * The signature design element: a single horizontal rule with a burgundy cursor
 * that slides along it as the user advances. Completed segments render as a
 * thinner burgundy/40 fill. Upcoming segments stay ash/10.
 *
 * No circles, no numbers-in-dots, no checkmarks. One rule, one cursor.
 */
export default function StepIndicator({
  steps,
  currentStepId,
  completedStepIds,
  onStepClick,
}: StepIndicatorProps) {
  const total = steps.length;
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStepId)
  );
  const segmentWidth = 100 / total;
  const activeLeft = currentIndex * segmentWidth;
  const completedCount = completedStepIds.length;
  const completedWidth = Math.min(completedCount, total) * segmentWidth;

  return (
    <div className="relative w-full mb-16 md:mb-20">
      {/* Base rule */}
      <div className="relative h-px bg-ash/10 w-full">
        {/* Completed fill (stationary, expands as steps complete) */}
        {completedWidth > 0 && (
          <div
            className="absolute top-0 left-0 h-[2px] bg-burgundy/40 -translate-y-[0.5px] transition-[width] duration-500"
            style={{
              width: `${completedWidth}%`,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        )}
        {/* Active cursor — slides to the current segment */}
        <div
          className="absolute top-0 h-[2px] bg-burgundy -translate-y-[0.5px] transition-[left] duration-500"
          style={{
            left: `${activeLeft}%`,
            width: `${segmentWidth}%`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Labels */}
      <div
        className="grid mt-5"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const isActive = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id);
          const colorClass = isActive
            ? 'text-burgundy'
            : isCompleted
              ? 'text-off-white'
              : 'text-ash/40';
          const isClickable = Boolean(onStepClick && isCompleted && !isActive);

          const inner = (
            <>
              <span className="tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mx-3 text-ash/30">·</span>
              <span>{step.label}</span>
            </>
          );

          const baseClasses = `font-mono text-[10px] tracking-[0.22em] uppercase transition-colors duration-300 ${colorClass} text-left`;

          if (isClickable) {
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick!(step.id)}
                className={`${baseClasses} hover:text-burgundy cursor-pointer`}
              >
                {inner}
              </button>
            );
          }
          return (
            <div key={step.id} className={baseClasses}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
