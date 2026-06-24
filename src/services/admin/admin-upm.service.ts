import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export type AdminUpmUser = {
    professionalId: string
    userId: string
    professionalUnitId: string
    unitId: string
    unitName: string
    name: string
    email: string
    cpf: string
    birthdate: string
    phone: string
    status: boolean
    roleKey: string
    roleDescription: string
    createdAt: string
    updatedAt: string
}

export type CreateAdminUpmUserInput = {
    unitId: string
    user: {
        name: string
        email: string
        cpf: string
        birthdate: string
        phone: string
        password: string
        status?: boolean
    }
}

export type UpdateAdminUpmUserInput = {
    user: {
        name: string
        email: string
        cpf: string
        birthdate: string
        phone: string
        status: boolean
    }
}

const BASE_URL = `${authBaseUrl}/admin/upm`

export const adminUpmService = {
    listUsers: () => fetchWithAuth<AdminUpmUser[]>(`${BASE_URL}/users`),
    createUser: (data: CreateAdminUpmUserInput) =>
        fetchWithAuth<AdminUpmUser>(`${BASE_URL}/users`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateUser: (professionalUnitId: string, data: UpdateAdminUpmUserInput) =>
        fetchWithAuth<AdminUpmUser>(`${BASE_URL}/users/${professionalUnitId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
}
