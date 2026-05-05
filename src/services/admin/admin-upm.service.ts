import { authBaseUrl } from "@/lib/auth"

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

const BASE_URL = `${authBaseUrl}/admin/upm`

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers)

    if (options?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Erro desconhecido" }))
        throw new Error(error?.message ?? `Erro ${response.status}`)
    }

    const text = await response.text()
    if (!text) return undefined as T

    return JSON.parse(text) as T
}

export const adminUpmService = {
    listUsers: () => apiFetch<AdminUpmUser[]>(`${BASE_URL}/users`),
    createUser: (data: CreateAdminUpmUserInput) =>
        apiFetch<AdminUpmUser>(`${BASE_URL}/users`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
}
