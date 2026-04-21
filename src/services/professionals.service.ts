import { authBaseUrl } from "@/lib/auth"

export interface Professional {
    id: string
    userId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateProfessionalInput {
    isActive?: boolean
}

export interface UpdateProfessionalInput {
    isActive?: boolean
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

export function getUnitIdHeader(): Record<string, string> {
    // Pull the unit ID from localStorage if set, otherwise empty
    const unitId = localStorage.getItem("x-unit-id") ?? ""
    return unitId ? { "x-unit-id": unitId } : {}
}

export const professionalsService = {
    list: (): Promise<Professional[]> =>
        apiFetch<Professional[]>(BASE_URL, {
            headers: getUnitIdHeader(),
        }),

    getById: (id: string): Promise<Professional> =>
        apiFetch<Professional>(`${BASE_URL}/${id}`, {
            headers: getUnitIdHeader(),
        }),

    create: (data: CreateProfessionalInput): Promise<Professional> =>
        apiFetch<Professional>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(data),
            headers: getUnitIdHeader(),
        }),

    update: (id: string, data: UpdateProfessionalInput): Promise<Professional> =>
        apiFetch<Professional>(`${BASE_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: getUnitIdHeader(),
        }),

    remove: (id: string): Promise<void> =>
        apiFetch<void>(`${BASE_URL}/${id}`, {
            method: "DELETE",
            headers: getUnitIdHeader(),
        }),
}
