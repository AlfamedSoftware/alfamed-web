function FieldSkeleton() {
    return <div className="h-11 animate-pulse rounded-xl bg-muted" />
}

export function AlteracaoProfissionaisSkeleton({ isProfileView = false }: { isProfileView?: boolean } = {}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="w-full h-full">
                <div className="w-full h-full overflow-hidden bg-card">
                    <div className="border-b border-border px-6 py-8 sm:px-10">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
                            <div className="space-y-2">
                                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-6 sm:px-10 sm:py-8">
                        <div className="grid gap-5">
                            <div className="space-y-2">
                                <div className="h-6 w-44 animate-pulse rounded bg-muted" />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton />
                                <FieldSkeleton />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton />
                                <FieldSkeleton />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton />
                                <FieldSkeleton />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton />
                                <div />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton />
                                <FieldSkeleton />
                            </div>

                            <div className="h-6 w-48 animate-pulse rounded bg-muted" />

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FieldSkeleton />
                                <FieldSkeleton />
                            </div>

                            {!isProfileView && (
                                <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                                </div>
                            )}

                            {!isProfileView && (
                                <>
                                    <div className="h-6 w-40 animate-pulse rounded bg-muted" />

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <FieldSkeleton />
                                        <FieldSkeleton />
                                    </div>
                                </>
                            )}

                            {!isProfileView && (
                                <>
                                    <div className="h-6 w-40 animate-pulse rounded bg-muted" />

                                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                            {!isProfileView && (
                                <div className="h-11 w-20 animate-pulse rounded-xl bg-muted" />
                            )}
                            <div className="h-11 w-32 animate-pulse rounded-xl bg-muted" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
