import { Skeleton } from "@/components/ui/skeleton"

export function SpecialtyFormSkeleton() {
    return (
        <div className="grid gap-5">
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>

                <div className="grid gap-2">
                    <Skeleton className="h-4 w-28" />
                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="grid gap-2">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-8 w-14 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-28 rounded-md" />
                </div>
            </div>
        </div>
    )
}