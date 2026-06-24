import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export interface SpecialtyUnitFullData {
    id: string
    unitId: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type CreateSpecialtyInput = {
    name: string
    isActive?: boolean
}

export type UpdateSpecialtyInput = {
    specialtyId: string
    name?: string
    isActive?: boolean
}

export const specialtiesService = {
    listByUnit: (unitId: string, options?: { isActive?: boolean }): Promise<SpecialtyUnitFullData[]> => {
        const params = new URLSearchParams()
        if (typeof options?.isActive === "boolean") params.set("isActive", String(options.isActive))
        const query = params.toString()
        return fetchWithAuth<SpecialtyUnitFullData[]>(
            `${authBaseUrl}/specialties/list-specialties-by-unit/${unitId}${query ? `?${query}` : ""}`,
        )
    },
    getById: (specialtyId: string): Promise<SpecialtyUnitFullData> =>
        fetchWithAuth<SpecialtyUnitFullData>(`${authBaseUrl}/specialties/${specialtyId}`),
    create: (data: CreateSpecialtyInput): Promise<SpecialtyUnitFullData> =>
        fetchWithAuth<SpecialtyUnitFullData>(`${authBaseUrl}/specialties`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    update: (data: UpdateSpecialtyInput): Promise<SpecialtyUnitFullData> =>
        fetchWithAuth<SpecialtyUnitFullData>(`${authBaseUrl}/specialties`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
}