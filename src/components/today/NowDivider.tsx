export function NowDivider() {
  return (
    <div className="relative flex items-center py-1">
      <div className="h-px flex-grow gradient-golden opacity-50" />
      <span className="mx-3 shrink-0 text-xs font-semibold tracking-wide text-primary uppercase">Now</span>
      <div className="h-px flex-grow gradient-golden opacity-50" />
    </div>
  )
}
