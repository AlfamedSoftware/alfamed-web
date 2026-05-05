import { PageHeader } from "@/components/page-header"

export function ProfissionaisEspecialidades() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PageHeader title="Vínculo de Especialidades" />

            <main className="flex flex-1 flex-col px-6 py-6">
                <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                    Conteúdo de vínculo entre profissionais e especialidades em breve.
                </div>
            </main>
        </div>
    )
}