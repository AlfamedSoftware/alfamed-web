import { authBaseUrl } from "@/lib/auth"

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

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Erro desconhecido" }))
        throw new Error(error?.message ?? `Erro ${response.status}`)
    }

    // 204 No Content or empty body
    const text = await response.text()
    if (!text) return undefined as T

    return JSON.parse(text) as T
}

// ❌ DEPRECATED: getUnitIdHeader removed
// Clinic ID now managed by backend session, not via headers

export const professionalsService = {
    list: (): Promise<Professional[]> =>
        apiFetch<Professional[]>(BASE_URL),

    getById: (id: string): Promise<Professional> =>
        apiFetch<Professional>(`${BASE_URL}/${id}`),

    create: (data: CreateProfessionalInput): Promise<Professional> =>
        apiFetch<Professional>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateProfessionalInput): Promise<Professional> =>
        apiFetch<Professional>(`${BASE_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    remove: (id: string): Promise<void> =>
        apiFetch<void>(`${BASE_URL}/${id}`, {
            method: "DELETE",
        }),
}
