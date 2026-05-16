import { useState, useEffect, useCallback } from "react"
import {
    professionalsService,
    type Professional,
    type ProfessionalUnitFullData,
} from "@/Servicos/professionals.service"

export type ProfessionalFilter = "all" | "active" | "inactive"

function transformProfessionalUnitData(data: ProfessionalUnitFullData): Professional {
    const user = Array.isArray(data.users) ? data.users[0] : data.users
    const professional = Array.isArray(data.professionals) ? data.professionals[0] : data.professionals
    const role = Array.isArray(data.roles) ? data.roles[0] : data.roles

    return {
        id: data.id,
        userId: user?.id ?? "",
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        cpf: user?.cpf ?? "",
        birthdate: user?.birthdate ?? "",
        crm: professional?.id ?? "",
        isActive: data.isActive,
        users: user ? [user] : [],
        roles: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
}

export function useProfessionals(unitId: string) {
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfessionals = useCallback(async () => {
        if (!unitId) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const unitData = await professionalsService.listByUnit(unitId)
            const data = unitData.map(transformProfessionalUnitData)
            setProfessionals(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar profissionais")
        } finally {
            setIsLoading(false)
        }
    }, [unitId])

    useEffect(() => {
        fetchProfessionals()
    }, [fetchProfessionals])

    const counts = {
        all: professionals.length,
        active: professionals.filter((p) => p.isActive).length,
        inactive: professionals.filter((p) => !p.isActive).length,
    }

    return {
        professionals,
        isLoading,
        error,
        counts,
    }
}
