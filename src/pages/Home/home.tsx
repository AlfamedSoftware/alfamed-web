import { PageHeader } from "@/components/page-header"
import { useSession } from "@/hooks/use-session"
import { getSelectedUnit } from "@/lib/selected-unit"
import { useMemo } from "react"

export function Home() {
    const { user } = useSession()

    const selectedUnitName = useMemo(() => {
        if (!user || typeof user !== "object") return null
        const id = (user as Record<string, unknown>).id
        if (typeof id !== "string") return null

        return getSelectedUnit(id)?.name ?? null
    }, [user])

    return (
        <>
            <PageHeader title="Dashboard" />
            <div className="flex flex-1 flex-col p-4">
                {selectedUnitName && (
                    <p className="mb-2 text-sm text-muted-foreground">
                        Unidade ativa: <span className="font-medium text-foreground">{selectedUnitName}</span>
                    </p>
                )}
                <p className="text-muted-foreground">Conteúdo de Dashboard em breve.</p>
            </div>
        </>
    )
}
