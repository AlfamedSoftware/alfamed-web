import { useCallback, useEffect, useState } from "react"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { professionalsService, type ProfessionalUnitFullData } from "@/Servicos/professionals.service"

export type Professional = {
    id: string
    userId: string
    name?: string
    email?: string
    crm?: string
    isActive: boolean
}

type ArrayItem<T> = T extends (infer U)[] ? U : T

type ProfessionalUnitUser = ArrayItem<NonNullable<ProfessionalUnitFullData["users"]>>
type ProfessionalUnitProfessional = ArrayItem<NonNullable<ProfessionalUnitFullData["professionals"]>>

function toArray<T>(value: T | T[] | null | undefined): T[] {
    if (!value) {
        return []
    }

    return Array.isArray(value) ? value : [value]
}

export function useProfessionals() {
    const { sessionUnit } = useSessionUnit()
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProfessionals = useCallback(async () => {
        const unitId = sessionUnit?.selectedUnitId

        if (!unitId) {
            setProfessionals([])
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const results: Professional[] = []

            try {
                const list = await professionalsService.listByUnit(unitId)

                for (const entry of list) {
                    const usersArray = toArray<ProfessionalUnitUser>(entry.users)
                    const profsArray = toArray<ProfessionalUnitProfessional>(entry.professionals)
                    const primaryUser = usersArray[0]

                    for (const professional of profsArray) {
                        results.push({
                            id: professional.id,
                            userId: primaryUser?.id ?? professional.id,
                            name: primaryUser?.name ?? undefined,
                            email: primaryUser?.email ?? undefined,
                            isActive: professional.isActive ?? true,
                        })
                    }
                }
            } catch {
                const professionalUnitId = sessionUnit?.selectedProfessionalUnitId || unitId
                const data: ProfessionalUnitFullData = await professionalsService.getFullDataByProfessionalUnitId(professionalUnitId)

                if (data.professionals) {
                    const profs = toArray<ProfessionalUnitProfessional>(data.professionals)
                    const usersArray = toArray<ProfessionalUnitUser>(data.users)
                    const primaryUser = usersArray[0]

                    for (const professional of profs) {
                        results.push({
                            id: professional.id,
                            userId: primaryUser?.id ?? professional.id,
                            name: primaryUser?.name ?? undefined,
                            email: primaryUser?.email ?? undefined,
                            isActive: professional.isActive ?? true,
                        })
                    }
                } else if (data.users) {
                    const usersArray = toArray<ProfessionalUnitUser>(data.users)
                    for (const user of usersArray) {
                        results.push({
                            id: user.id,
                            userId: user.id,
                            name: user.name,
                            email: user.email,
                            isActive: user.isActive ?? true,
                        })
                    }
                }
            }

            setProfessionals(Array.from(new Map(results.map((professional) => [professional.id, professional])).values()))
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
