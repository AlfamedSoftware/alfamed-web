import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export interface ProcedureUnitFullData {
    id: string
    unitId: string
    description: string
    observation: string | null
    code: string
    price: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type CreateProcedureInput = {
    description: string
    observation: string
    code: string
    price: string
    isActive?: boolean
}

export const proceduresService = {
    listByUnit: (unitId: string): Promise<ProcedureUnitFullData[]> =>
        fetchWithAuth<ProcedureUnitFullData[]>(
            `${authBaseUrl}/procedures/list-procedures-by-unit/${unitId}`,
        ),
    create: (data: CreateProcedureInput): Promise<ProcedureUnitFullData> =>
        fetchWithAuth<ProcedureUnitFullData>(`${authBaseUrl}/procedures`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
}