import { PageHeader } from "@/components/page-header"

export function Perfil() {
    return (
        <>
            <PageHeader title="Perfil" />
            <div className="flex flex-1 flex-col p-4">
                <p className="text-muted-foreground">Conteúdo do perfil em breve.</p>
            </div>
        </>
    )
}
