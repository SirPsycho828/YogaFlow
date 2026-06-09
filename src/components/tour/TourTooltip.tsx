import type { TooltipRenderProps } from 'react-joyride'

export function TourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="w-[280px] rounded-xl border border-border bg-card p-4 shadow-lg"
    >
      {step.title && (
        <h3 className="font-heading text-base font-semibold text-foreground mb-1">
          {step.title}
        </h3>
      )}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {step.content}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          {...skipProps}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="rounded-lg gradient-studio px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
