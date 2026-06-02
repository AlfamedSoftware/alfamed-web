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
    listByUnit: (unitId: string): Promise<SpecialtyUnitFullData[]> =>
        fetchWithAuth<SpecialtyUnitFullData[]>(
            `${authBaseUrl}/specialties/list-specialties-by-unit/${unitId}`,
        ),
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