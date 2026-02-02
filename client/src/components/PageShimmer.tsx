import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageShimmerVariant = "default" | "table" | "cards" | "form";
type PageShimmerPage =
  | "leads"
  | "conversations"
  | "analytics"
  | "usage"
  | "automations"
  | "openClawAutomations"
  | "appointments"
  | "integrations"
  | "leadDetail"
  | "leadEdit"
  | "userSupport"
  | "adminDashboard"
  | "adminUsers"
  | "adminBilling"
  | "adminSupport"
  | "adminAnalytics";

interface PageShimmerProps {
  /** Layout 100% fiel à página (prioridade sobre variant) */
  page?: PageShimmerPage;
  variant?: PageShimmerVariant;
  className?: string;
  cardCount?: number;
  tableRows?: number;
}

function TableShimmer({ cols = 6, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex gap-4 p-4 border-b border-border bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 min-w-0 max-w-[120px] rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 border-b border-border/50 last:border-0 items-center"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-1 min-w-0">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 flex-1 max-w-[140px] rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-8 w-8 rounded ml-auto shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PageShimmer({
  page,
  variant = "default",
  className,
  cardCount = 4,
  tableRows = 6,
}: PageShimmerProps) {
  const baseSpace = "w-full space-y-6 sm:space-y-8 pb-12";

  const renderHeader = (titleWidth = "w-48 sm:w-64", twoButtons = true) => (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className={cn("h-9 rounded-lg", titleWidth)} />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>
      {twoButtons && (
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );

  // ——— Páginas específicas (100% fiéis ao layout) ———
  if (page === "leads") {
    return (
      <div className={cn(baseSpace, className)}>
        {renderHeader()}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
          ))}
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row gap-4">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 w-full md:w-[200px] rounded-lg" />
          </div>
        </div>
        <TableShimmer cols={6} rows={8} />
      </div>
    );
  }

  if (page === "conversations") {
    return (
      <div className={cn(baseSpace, className)}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-56 rounded-lg" />
            <Skeleton className="h-5 w-full max-w-md rounded" />
          </div>
          <div className="flex items-center gap-4 p-2 rounded-xl border w-fit">
            <div className="px-4 py-2 space-y-1">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-6 w-14 rounded" />
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="px-4 py-2 space-y-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-6 w-14 rounded" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="h-1 bg-primary/20 w-full" />
          <div className="p-6 flex flex-col md:flex-row gap-4">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 w-28 rounded-lg" />
          </div>
        </div>
        <TableShimmer cols={6} rows={8} />
      </div>
    );
  }

  if (page === "analytics") {
    return (
      <div className={cn(baseSpace, className)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-40 rounded" />
            <Skeleton className="h-5 w-80 mt-2 rounded" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (page === "usage") {
    return (
      <div className={cn("w-full space-y-6 pb-12", className)}>
        <div>
          <Skeleton className="h-9 w-48 rounded" />
          <Skeleton className="h-4 w-72 mt-2 rounded" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    );
  }

  if (page === "automations") {
    return (
      <div className={cn("w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8 pb-8 sm:pb-12", className)}>
        <header className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-40 rounded" />
            <Skeleton className="h-4 w-80 mt-2 rounded" />
          </div>
          <Skeleton className="h-11 w-full sm:w-auto sm:min-w-[180px] rounded-xl" />
        </header>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
          ))}
        </section>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (page === "openClawAutomations") {
    return (
      <div className={cn(baseSpace, className)}>
        {renderHeader("w-56", true)}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (page === "appointments") {
    return (
      <div className={cn(baseSpace, className)}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-72 rounded-lg" />
            <Skeleton className="h-5 w-96 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <Skeleton className="md:w-48 h-24 md:h-auto rounded-none" />
                <div className="flex-1 p-6 space-y-4">
                  <Skeleton className="h-6 w-48 rounded" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "integrations") {
    return (
      <div className={cn("space-y-6 sm:space-y-8 pb-8 sm:pb-12 px-1 sm:px-0", className)}>
        <div className="rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-3 sm:gap-4 min-w-0">
              <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shrink-0" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-7 w-56 rounded" />
                <Skeleton className="h-4 w-full max-w-sm rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (page === "leadDetail") {
    return (
      <div className={cn("w-full pb-12", className)}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-4">
            <Skeleton className="h-8 w-36 rounded" />
            <div className="flex items-center gap-4 flex-wrap">
              <Skeleton className="h-10 w-56 rounded" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="flex gap-6">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 w-32 rounded-lg" />
            <Skeleton className="h-12 w-28 rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (page === "leadEdit") {
    return (
      <div className={cn("w-full pb-12", className)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-9 w-64 rounded" />
            <Skeleton className="h-4 w-96 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-64 rounded-xl" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1 rounded-lg" />
              <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "userSupport") {
    return (
      <div className={cn("min-h-[calc(100dvh-8rem)] flex flex-col", className)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-44 rounded" />
            <Skeleton className="h-4 w-56 mt-1 rounded" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[420px] rounded-2xl overflow-hidden border border-border">
          <aside className="lg:col-span-1 flex flex-col border-r border-border">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="p-2 space-y-2 flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </aside>
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <div className="flex-1 p-4 space-y-4">
              <Skeleton className="h-16 w-3/4 rounded-xl" />
              <Skeleton className="h-16 w-1/2 rounded-xl ml-auto" />
              <Skeleton className="h-16 w-3/4 rounded-xl" />
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "adminDashboard") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-72 rounded" />
            <Skeleton className="h-4 w-48 mt-1 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (page === "adminUsers" || page === "adminBilling") {
    return (
      <div className={cn(baseSpace, className)}>
        {renderHeader()}
        <TableShimmer cols={6} rows={8} />
      </div>
    );
  }

  if (page === "adminSupport") {
    return (
      <div className={cn(baseSpace, className)}>
        {renderHeader()}
        <TableShimmer cols={5} rows={6} />
      </div>
    );
  }

  if (page === "adminAnalytics") {
    return (
      <div className={cn(baseSpace, className)}>
        {renderHeader()}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  // ——— Fallback: variantes genéricas ———
  return (
    <div className={cn(baseSpace, className)}>
      {renderHeader()}

      {variant === "default" && (
        <>
          <div
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(cardCount, 4)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cardCount }).map((_, i) => (
              <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </>
      )}

      {variant === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cardCount }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {variant === "table" && (
        <>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <TableShimmer cols={6} rows={tableRows} />
        </>
      )}

      {variant === "form" && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </>
      )}
    </div>
  );
}
