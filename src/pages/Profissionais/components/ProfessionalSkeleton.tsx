import { Skeleton } from "@/components/ui/skeleton"

export function ProfessionalCardSkeleton() {
    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                    </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Contact */}
            <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-3.5 h-3.5 rounded" />
                    <Skeleton className="h-3 w-36 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="w-3.5 h-3.5 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
            </div>
        </div>
    )
}

export function ProfessionalGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProfessionalCardSkeleton key={i} />
            ))}
        </div>
    )
}
