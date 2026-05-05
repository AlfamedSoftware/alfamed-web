import { PageHeader } from "@/components/page-header"
export function Home() {
    return (
        <>
            <PageHeader title="Início" />
            <div className="flex flex-1 flex-col p-4">
                <p className="text-muted-foreground">Conteúdo de Início em breve.</p>
            </div>
        </>
    )
}
