export function LoadingState() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 py-8 animate-in fade-in duration-500">
      {/* Repo info skeleton */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-md skeleton-shimmer" />
            <div className="h-4 w-72 rounded-md skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 rounded-md skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
            <div className="h-4 w-12 rounded-md skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>

      {/* Action bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-48 rounded-lg skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-lg skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-9 w-20 rounded-lg skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
          <div className="h-9 w-24 rounded-lg skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
        {/* Title */}
        <div className="h-8 w-3/4 rounded-md skeleton-shimmer" />

        {/* Description */}
        <div className="space-y-2.5">
          <div className="h-4 w-full rounded skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-5/6 rounded skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
          <div className="h-4 w-2/3 rounded skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full skeleton-shimmer" />
          <div className="h-5 w-20 rounded-full skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-5 w-28 rounded-full skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
        </div>

        {/* Section heading */}
        <div className="h-6 w-1/3 rounded skeleton-shimmer" />

        {/* List items */}
        <div className="space-y-2 pl-4">
          <div className="h-4 w-4/5 rounded skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-3/5 rounded skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
          <div className="h-4 w-4/5 rounded skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
          <div className="h-4 w-2/5 rounded skeleton-shimmer" style={{ animationDelay: '0.25s' }} />
        </div>

        {/* Another section */}
        <div className="h-6 w-1/4 rounded skeleton-shimmer" />

        {/* Code block */}
        <div className="rounded-lg bg-muted/20 p-4 space-y-2 border border-border/50">
          <div className="h-4 w-3/4 rounded skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-1/2 rounded skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
          <div className="h-4 w-2/3 rounded skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* More content */}
        <div className="h-6 w-2/5 rounded skeleton-shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-4/5 rounded skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>Generating your README...</span>
      </div>
    </div>
  );
}
