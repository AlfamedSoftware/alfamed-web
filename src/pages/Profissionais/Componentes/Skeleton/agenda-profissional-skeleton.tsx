function Pulse({ className }: { className: string }) {
    return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

export function AgendaSchedulesSkeleton() {
    return (
        <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-muted/20 p-4 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="grid gap-2">
                        <Pulse className="h-4 w-24" />
                        <Pulse className="h-3 w-72 max-w-full" />
                    </div>
                    <Pulse className="h-9 w-28 rounded-full" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="grid gap-2">
                        <Pulse className="h-3 w-8" />
                        <Pulse className="h-11 rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                        <Pulse className="h-3 w-12" />
                        <Pulse className="h-11 rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                        <Pulse className="h-3 w-8" />
                        <Pulse className="h-11 rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                        <Pulse className="h-3 w-32" />
                        <Pulse className="h-11 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function AgendaProfissionalSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="flex-1 px-6">
                <div className="border-b border-border py-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 animate-pulse rounded-full bg-muted shadow-sm" />
                        <Pulse className="h-[22px] w-48" />
                    </div>
                </div>

                <div className="grid gap-5 py-6">
                    <section className="grid gap-4">
                        <Pulse className="h-7 w-56" />
                        <AgendaSchedulesSkeleton />

                        <div className="flex flex-wrap gap-2">
                            <Pulse className="h-10 w-36 rounded-full" />
                        </div>
                    </section>

                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                        <Pulse className="h-11 w-24 rounded-xl" />
                        <Pulse className="h-11 w-40 rounded-xl" />
                    </div>
                </div>
            </main>
        </div>
    )
}
