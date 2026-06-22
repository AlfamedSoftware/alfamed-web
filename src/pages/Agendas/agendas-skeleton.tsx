function Pulse({ className }: { className: string }) {
    return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

function ProfessionalRowSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
            <Pulse className="size-4 rounded" />
            <Pulse className="size-3 rounded-full" />
            <Pulse className="h-3.5 w-32" />
        </div>
    )
}

function CalendarWeekSkeleton() {
    const cols = 5
    const rows = 10

    return (
        <div className="flex h-full min-h-[620px] flex-col lg:min-h-[680px]">
            <div className="flex border-b border-border">
                <div className="w-16 shrink-0" />
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5 border-l border-border py-3">
                        <Pulse className="h-3 w-7" />
                        <Pulse className="h-6 w-6 rounded-full" />
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-hidden">
                {Array.from({ length: rows }).map((_, row) => (
                    <div key={row} className="flex border-b border-border">
                        <div className="flex w-16 shrink-0 items-start justify-end pr-2 pt-1">
                            <Pulse className="h-3 w-10" />
                        </div>
                        {Array.from({ length: cols }).map((_, col) => (
                            <div key={col} className="flex-1 border-l border-border" style={{ height: 56 }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export function AgendasSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <Pulse className="h-7 w-48" />
                <Pulse className="h-9 w-44 rounded-md" />
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="w-full lg:w-72">
                    <div className="rounded-xl border border-border bg-background p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Pulse className="size-4" />
                            <Pulse className="h-4 w-24" />
                        </div>
                        <div className="grid gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <ProfessionalRowSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                        <CalendarWeekSkeleton />
                    </div>
                </div>
            </div>
        </div>
    )
}
