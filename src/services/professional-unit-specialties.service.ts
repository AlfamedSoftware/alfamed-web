import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export interface ProfessionalUnitSpecialty {
    id: string
    professionalUnitId: string
    specialtyId: string
    specialty: {
        id: string
        name: string
        isActive: boolean
    }
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type CreateProfessionalUnitSpecialtyInput = {
    professionalUnitId: string
    specialtyId: string
}

export type UpdateProfessionalUnitSpecialtyInput = {
    id: string
    isActive?: boolean
}

export const professionalUnitSpecialtiesService = {
    listByProfessionalUnit: (professionalUnitId: string): Promise<ProfessionalUnitSpecialty[]> =>
        fetchWithAuth<ProfessionalUnitSpecialty[]>(
            `${authBaseUrl}/professional-unit-specialties/list-by-professional-unit/${professionalUnitId}`,
        ),

    create: (data: CreateProfessionalUnitSpecialtyInput): Promise<ProfessionalUnitSpecialty> =>
        fetchWithAuth<ProfessionalUnitSpecialty>(`${authBaseUrl}/professional-unit-specialties`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (data: UpdateProfessionalUnitSpecialtyInput): Promise<ProfessionalUnitSpecialty> =>
        fetchWithAuth<ProfessionalUnitSpecialty>(`${authBaseUrl}/professional-unit-specialties`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
}
