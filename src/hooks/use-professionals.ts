import { useState, useEffect, useCallback } from "react"
import {
    professionalsService,
    type Professional,
    type CreateProfessionalInput,
    type UpdateProfessionalInput,
} from "@/services/professionals.service"

export type ProfessionalFilter = "all" | "active" | "inactive"

export function useProfessionals() {
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfessionals = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await professionalsService.list()
            setProfessionals(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar profissionais")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfessionals()
    }, [fetchProfessionals])

    const createProfessional = async (data: CreateProfessionalInput) => {
        const created = await professionalsService.create(data)
        setProfessionals((prev) => [...prev, created])
        return created
    }

    const updateProfessional = async (id: string, data: UpdateProfessionalInput) => {
        const updated = await professionalsService.update(id, data)
        setProfessionals((prev) => prev.map((p) => (p.id === id ? updated : p)))
        return updated
    }

    const removeProfessional = async (id: string) => {
        await professionalsService.remove(id)
        setProfessionals((prev) => prev.filter((p) => p.id !== id))
    }

    const toggleActive = async (id: string, currentIsActive: boolean) => {
        return updateProfessional(id, { isActive: !currentIsActive })
    }

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
        refetch: fetchProfessionals,
        createProfessional,
        updateProfessional,
        removeProfessional,
        toggleActive,
    }
}
