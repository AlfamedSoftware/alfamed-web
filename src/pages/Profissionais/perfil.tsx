import { useEffect, useState } from "react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { useSession } from "@/hooks/use-session"
import { useSessionUnit } from "@/contexts/session-unit-context"

import { ProfessionalProfile } from "./edicao-profissionais"
import { AlteracaoProfissionaisSkeleton } from "./Componentes/Skeleton/alteracao-profissionais-skeleton"

export function Perfil() {
    const { user, isLoading: isSessionLoading } = useSession()
    const { sessionUnit } = useSessionUnit()
    const [professionalUnitId, setProfessionalUnitId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let alive = true

        async function loadProfessionalUnitProfile() {
            if (isSessionLoading) {
                return
            }

            if (!user?.id) {
                setIsLoading(false)
                setError("Nao foi possivel identificar o usuario da sessao.")
                return
            }

            setIsLoading(true)
            setError("")

            try {
                if (!alive) return

                const selectedProfessionalUnitId = sessionUnit?.selectedProfessionalUnitId ?? null

                if (!selectedProfessionalUnitId) {
                    setProfessionalUnitId(null)
                    setError("Nao foi encontrada um profissional selecionado para a sessão.")
                    return
                }

                setProfessionalUnitId(selectedProfessionalUnitId)
            } catch {
                if (!alive) return
                setProfessionalUnitId(null)
                setError("Erro ao carregar o perfil do profissional.")
            } finally {
                if (alive) {
                    setIsLoading(false)
                }
            }
        }

        void loadProfessionalUnitProfile()

        return () => {
            alive = false
        }
    }, [isSessionLoading, sessionUnit?.selectedProfessionalUnitId, user?.id])

    if (isSessionLoading || isLoading) {
        return (
            <>
                <PageHeader title="Perfil" />
                <AlteracaoProfissionaisSkeleton isProfileView />
            </>
        )
    }

    if (!professionalUnitId) {
        return (
            <>
                <PageHeader title="Perfil" />
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                    <Button type="button" variant="outline" className="w-fit" onClick={() => window.location.reload()}>
                        Tentar novamente
                    </Button>
                </div>
            </>
        )
    }

    return <ProfessionalProfile professionalUnitId={professionalUnitId} afterSavePath={null} isProfileView />
}
