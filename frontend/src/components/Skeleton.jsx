export function Skeleton({ className = '', rounded = 'rounded-2xl' }) {
  return (
    <div className={`skeleton ${rounded} ${className}`} />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl p-4 bg-[var(--surface)] border border-[var(--border)] ${className}`}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-36 mb-2" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-32 mb-2" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
