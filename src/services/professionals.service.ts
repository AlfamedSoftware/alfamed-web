import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export interface Professional {
    id: string
    userId: string
    name?: string
    email?: string
    crm?: string
    phone?: string
    cpf?: string
    birthdate?: string
    unit?: { id: string; name: string } | null
    patientsActive?: number
    users?: { id: string; name: string; email: string; phone?: string; cpf?: string; birthdate?: string }[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateProfessionalInput {
    isActive?: boolean
}

export interface UpdateProfessionalInput {
    isActive?: boolean
    name?: string
    email?: string
    phone?: string
    cpf?: string
    birthdate?: string
    crm?: string
}

const BASE_URL = `${authBaseUrl}/professionals`

export const professionalsService = {
    list: (): Promise<Professional[]> =>
        fetchWithAuth<Professional[]>(BASE_URL),

    getById: (id: string): Promise<Professional> =>
        fetchWithAuth<Professional>(`${BASE_URL}/${id}`),

    create: (data: CreateProfessionalInput): Promise<Professional> =>
        fetchWithAuth<Professional>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateProfessionalInput): Promise<Professional> =>
        fetchWithAuth<Professional>(`${BASE_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    remove: (id: string): Promise<void> =>
        fetchWithAuth<void>(`${BASE_URL}/${id}`, {
            method: "DELETE",
        }),
}
