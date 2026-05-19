import { PageHeader } from "@/components/page-header"

export function Procedimentos() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PageHeader title="Procedimentos" />

            <main className="flex flex-1 flex-col px-6 py-6">
                <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                    Conteúdo de procedimentos em breve.
                </div>
            </main>
        </div>
    )
}