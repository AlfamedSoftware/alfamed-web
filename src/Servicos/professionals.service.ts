import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export interface ProfessionalUnitFullData {
    id: string
    isActive: boolean
    patients?:
        | {
              id: string
              isActive: boolean
          }
        | Array<{
              id: string
              isActive: boolean
          }>
    professionals?:
        | {
              id: string
              isActive: boolean
          }
        | Array<{
              id: string
              isActive: boolean
          }>
    professionalUnitRoles?:
        | {
              id: string
          }
        | Array<{
              id: string
          }>
    roles?:
        | {
              id: string
              name: string
              isActive: boolean
          }
        | Array<{
              id: string
              name: string
              isActive: boolean
          }>
    users?:
        | {
              id: string
              name: string
              email: string
              phone?: string
              cpf?: string
              birthdate?: string
              isActive: boolean
          }
        | Array<{
              id: string
              name: string
              email: string
              phone?: string
              cpf?: string
              birthdate?: string
              isActive: boolean
          }>
}

type ListByUnitOptions = {
    isActive?: boolean
    roleKey?: string
}

export interface ProfessionalCpfLookupUser {
    id: string
    name?: string
    email?: string
    cpf?: string
    phone?: string
    birthdate?: string
    isActive?: boolean
}

export interface ProfessionalCpfLookupResponse {
    patientId?: string
    professionalId?: string
    professionalUnitId?: string
    userId?: string
    exists?: boolean
    alreadyLinkedToUnit?: boolean
    user?: ProfessionalCpfLookupUser | null
    professionalUnit?: {
        id?: string
        professionalId?: string
        [key: string]: unknown
    } | null
    id?: string
    name?: string
    email?: string
    phone?: string
    crm?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
}

export const professionalsService = {
    getFullDataByProfessionalUnitId: (professionalUnitId: string): Promise<ProfessionalUnitFullData> =>
        fetchWithAuth<ProfessionalUnitFullData>(
            `${authBaseUrl}/professional-units/professional-unit-full-data/${professionalUnitId}`,
        ),

    listByUnit: (unitId: string, options?: ListByUnitOptions): Promise<ProfessionalUnitFullData[]> => {
        const params = new URLSearchParams()

        if (typeof options?.isActive === "boolean") {
            params.set("isActive", String(options.isActive))
        }

        if (options?.roleKey !== undefined) {
            params.set("roleKey", options.roleKey)
        }

        const query = params.toString()

        return fetchWithAuth<ProfessionalUnitFullData[]>(
            `${authBaseUrl}/professional-units/list-professional-unit-full-data-by-unit/${unitId}${query ? `?${query}` : ""}`,
        )
    },

    checkUserByCpf: (cpf: string): Promise<ProfessionalCpfLookupResponse> => {
        const params = new URLSearchParams({ cpf })

        return fetchWithAuth<ProfessionalCpfLookupResponse>(
            `${authBaseUrl}/professionals/professional-by-user-cpf?${params.toString()}`,
        )
    },

    linkUserToUnit: (cpf: string, options?: { roleId?: string; isActive?: boolean; patientExists?: boolean; professionalExists?: boolean }): Promise<void> => {
        const { roleId, isActive = true, patientExists, professionalExists } = options ?? {}

        return fetchWithAuth<void>(`${authBaseUrl}/professional-units/create-by-user-cpf`, {
            method: "POST",
            body: JSON.stringify({ cpf, isActive, ...(roleId ? { roleId } : {}), ...(patientExists !== undefined ? { patientExists } : {}), ...(professionalExists !== undefined ? { professionalExists } : {}) }),
        })
    },
}