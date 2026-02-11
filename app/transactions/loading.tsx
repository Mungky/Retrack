import { Skeleton } from "@/components/ui/skeleton";

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-4">
      <Skeleton className="w-11 h-11 rounded-[12px] flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-20 flex-shrink-0" />
    </div>
  );
}

export default function TransactionsLoading() {
  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      {/* Header: Title + Filter Buttons placeholder */}
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Search bar placeholder */}
      <div className="mb-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      {/* List: 7 transaction rows */}
      <div className="rounded-2xl overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
