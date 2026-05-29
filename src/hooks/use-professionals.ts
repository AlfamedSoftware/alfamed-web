import { useCallback, useEffect, useState } from "react"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { professionalsService, type ProfessionalUnitFullData } from "@/Servicos/professionals.service"

export type Professional = {
    id: string
    userId: string
    name?: string
    email?: string
    isActive: boolean
}

export function useProfessionals() {
    const { sessionUnit } = useSessionUnit()
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProfessionals = useCallback(async () => {
        const professionalUnitId = sessionUnit?.selectedProfessionalUnitId || sessionUnit?.selectedUnitId

        if (!professionalUnitId) {
            setProfessionals([])
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Try to fetch full data for the professional unit
            const data: ProfessionalUnitFullData = await professionalsService.getFullDataByProfessionalUnitId(professionalUnitId)

            const results: Professional[] = []

            // Prefer using the `users` array when present since it contains userId and profile info
            if (data.users) {
                const usersArray = Array.isArray(data.users) ? data.users : [data.users]
                for (const u of usersArray) {
                    results.push({
                        id: u.id,
                        userId: u.id,
                        name: (u as any).name,
                        email: (u as any).email,
                        isActive: (u as any).isActive ?? true,
                    })
                }
            } else if (data.professionals) {
                const profs = Array.isArray(data.professionals) ? data.professionals : [data.professionals]
                for (const p of profs) {
                    results.push({ id: p.id, userId: p.id, isActive: p.isActive ?? true })
                }
            }

            setProfessionals(results)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
            setProfessionals([])
        } finally {
            setIsLoading(false)
        }
    }, [sessionUnit])

    useEffect(() => {
        void fetchProfessionals()
    }, [fetchProfessionals])

    return {
        professionals,
        isLoading,
        error,
        refetch: fetchProfessionals,
    }
}

export default useProfessionals
