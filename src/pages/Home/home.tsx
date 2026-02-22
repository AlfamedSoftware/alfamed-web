import { PageHeader } from "@/components/page-header"

export function Home() {
    return (
        <>
            <PageHeader title="Dashboard" />
            <div className="flex flex-1 flex-col p-4">
                <p className="text-muted-foreground">Conteúdo de Dashboard em breve.</p>
            </div>
        </>
    )
}
