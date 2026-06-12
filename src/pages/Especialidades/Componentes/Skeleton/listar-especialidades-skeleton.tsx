import { Skeleton } from "@/components/ui/skeleton"

export function SpecialtyGridListSkeleton({ count = 24 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <SpecialtyCardSkeleton key={index} />
            ))}
        </div>
    )
}

export function SpecialtyCardSkeleton() {
    return (
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    )
}