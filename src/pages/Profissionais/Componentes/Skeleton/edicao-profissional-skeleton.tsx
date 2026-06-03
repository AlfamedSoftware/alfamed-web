function Pulse({ className }: { className: string }) {
    return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

function FieldSkeleton({ labelWidth = "w-24" }: { labelWidth?: string }) {
    return (
        <div className="grid gap-2">
            <Pulse className={`h-4 ${labelWidth}`} />
            <Pulse className="h-11 rounded-xl" />
        </div>
    )
}

function SectionTitleSkeleton({ width = "w-24" }: { width?: string }) {
    return <Pulse className={`h-7 ${width}`} />
}

function StatusSkeleton() {
    return (
        <div className="grid gap-2 sm:grid-cols-1">
            <Pulse className="h-4 w-36" />
            <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="grid flex-1 gap-2">
                        <Pulse className="h-3 w-full max-w-3xl" />
                        <Pulse className="h-3 w-2/3 max-w-xl" />
                    </div>
                    <div className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-muted" />
                </div>
            </div>
        </div>
    )
}

function ScheduleSkeleton({ index }: { index: number }) {
    return (
        <div className="rounded-2xl border border-border bg-muted/20 p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="grid gap-2">
                    <Pulse className="h-4 w-24" />
                    <Pulse className="h-3 w-72 max-w-full" />
                </div>
                <Pulse className="h-9 w-28 rounded-full" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FieldSkeleton labelWidth={index === 0 ? "w-8" : "w-12"} />
                <FieldSkeleton labelWidth="w-12" />
                <FieldSkeleton labelWidth="w-8" />
                <div className="grid gap-2">
                    <Pulse className="h-3 w-32" />
                    <Pulse className="h-11 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export function EdicaoProfissionalSkeleton({ isProfileView = false }: { isProfileView?: boolean } = {}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="flex-1 px-6">
                <div className="border-b border-border py-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 animate-pulse rounded-full bg-muted shadow-sm" />
                        <div>
                            <Pulse className="h-[22px] w-48" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 py-6">
                    <div className="grid gap-5">
                        <section className="grid gap-4">
                            <SectionTitleSkeleton width="w-18" />

                            <div className="grid gap-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton labelWidth="w-28" />
                                    <FieldSkeleton labelWidth="w-40" />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton labelWidth="w-10" />
                                    <FieldSkeleton labelWidth="w-14" />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton labelWidth="w-36" />
                                    <FieldSkeleton labelWidth="w-16" />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton labelWidth="w-10" />
                                    <div />
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            <SectionTitleSkeleton width="w-28" />

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton labelWidth="w-12" />
                                <FieldSkeleton labelWidth="w-28" />
                            </div>

                            {!isProfileView ? <StatusSkeleton /> : null}
                        </section>

                        {!isProfileView ? (
                            <section className="grid gap-4">
                                <SectionTitleSkeleton width="w-20" />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton labelWidth="w-12" />
                                </div>
                            </section>
                        ) : null}

                        {!isProfileView ? (
                            <section className="grid gap-4">
                                <SectionTitleSkeleton width="w-20" />
                                <StatusSkeleton />
                            </section>
                        ) : null}
                    </div>

                    {!isProfileView ? (
                        <section className="mt-6 grid gap-4">
                            <SectionTitleSkeleton width="w-52" />
                            <div className="grid gap-3">
                                <ScheduleSkeleton index={0} />
                                <ScheduleSkeleton index={1} />

                                <div className="flex flex-wrap gap-2">
                                    <Pulse className="h-10 w-36 rounded-full" />
                                    <Pulse className="h-10 w-32 rounded-full" />
                                </div>
                            </div>
                        </section>
                    ) : null}

                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                        {!isProfileView ? <Pulse className="h-11 w-24 rounded-xl" /> : null}
                        <Pulse className="h-11 w-40 rounded-xl" />
                    </div>
                </div>
            </main>
        </div>
    )
}
