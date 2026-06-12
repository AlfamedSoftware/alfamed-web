import { Skeleton } from "@/components/ui/skeleton"

export function ProcedureCardSkeleton() {
    return (
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-36 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div className="mb-4 border-t border-border" />

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                </div>
            </div>
        </div>
    )
}

export function ProcedureGridSkeleton({ count = 24 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <ProcedureCardSkeleton key={index} />
            ))}
        </div>
    )
}
