import { Skeleton } from "@/components/ui/skeleton"

export function ProfissionaisEspecialidadesSkeleton() {
    return (
        <div className="grid gap-5">
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Skeleton className="h-4 w-64" />
                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between gap-4 py-2">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-9 w-20 rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                <Skeleton className="h-10 w-24 rounded-md" />
            </div>
        </div>
    )
}
