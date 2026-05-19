import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

// Mantém apenas o tipo principal e as APIs de leitura usadas globalmente.
export interface ProfessionalUnitFullData {
    id: string
    isActive: boolean
    patients?: {
        id: string
        isActive: boolean
    } | Array<{
        id: string
        isActive: boolean
    }>
    professionals?: {
        id: string
        isActive: boolean
    } | Array<{
        id: string
        isActive: boolean
    }>
    professionalUnitRoles?: {
        id: string
    } | Array<{
        id: string
    }>
    roles?: {
        id: string
        name: string
        isActive: boolean
    } | Array<{
        id: string
        name: string
        isActive: boolean
    }>
    users?: {
        id: string
        name: string
        email: string
        phone?: string
        cpf?: string
        birthdate?: string
        isActive: boolean
    } | Array<{
        id: string
        name: string
        email: string
        phone?: string
        cpf?: string
        birthdate?: string
        isActive: boolean
    }>
}

//Funções usadas na listagem de profissionais e no perfil do profissional
export const professionalsService = {
    getFullDataByProfessionalUnitId: (professionalUnitId: string): Promise<ProfessionalUnitFullData> =>
        fetchWithAuth<ProfessionalUnitFullData>(
            `${authBaseUrl}/professional-units/professional-unit-full-data/${professionalUnitId}`,
        ),

    listByUnit: (unitId: string): Promise<ProfessionalUnitFullData[]> =>
        fetchWithAuth<ProfessionalUnitFullData[]>(
            `${authBaseUrl}/professional-units/list-professional-unit-full-data-by-unit/${unitId}`
        ),
}
