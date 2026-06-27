import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

interface ProcedureSpecialty {
    id: string
    name: string
    isActive: boolean
}

export interface ProcedureUnitFullData {
    id: string
    unitId: string
    description: string
    observation: string | null
    code: string
    price: string
    type: number
    specialtyId: string | null
    specialty: ProcedureSpecialty | null
    isActive: boolean
    isPerformedInUnit: boolean
    createdAt: string
    updatedAt: string
}

export type CreateProcedureInput = {
    description: string
    observation: string
    code: string
    price: string
    type: number
    specialtyId?: string | null
    isActive?: boolean
    isPerformedInUnit?: boolean
}

export type UpdateProcedureInput = {
    procedureId: string
    description?: string
    observation?: string | null
    code?: string
    price?: string
    type?: number
    specialtyId?: string | null
    isActive?: boolean
    isPerformedInUnit?: boolean
}

export const proceduresService = {
    listByUnit: (
        unitId: string,
        options?: { specialtyId?: string; isActive?: boolean },
    ): Promise<ProcedureUnitFullData[]> => {
        const params = new URLSearchParams()
        if (options?.specialtyId) params.set("specialtyId", options.specialtyId)
        if (typeof options?.isActive === "boolean") params.set("isActive", String(options.isActive))
        const query = params.toString()
        return fetchWithAuth<ProcedureUnitFullData[]>(
            `${authBaseUrl}/procedures/list-procedures-by-unit/${unitId}${query ? `?${query}` : ""}`,
        )
    },
    getById: (procedureId: string): Promise<ProcedureUnitFullData> =>
        fetchWithAuth<ProcedureUnitFullData>(
            `${authBaseUrl}/procedures/${procedureId}`,
        ),
    create: (data: CreateProcedureInput): Promise<ProcedureUnitFullData> =>
        fetchWithAuth<ProcedureUnitFullData>(`${authBaseUrl}/procedures`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    update: (data: UpdateProcedureInput): Promise<ProcedureUnitFullData> =>
        fetchWithAuth<ProcedureUnitFullData>(`${authBaseUrl}/procedures`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
}