import { authBaseUrl } from "@/lib/auth"

export type PatientListItem = {
    id: string
    userId: string
    name: string
    email: string
    phone: string
    isActive: boolean
}

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

const BASE_URL = `${authBaseUrl}/patients`

export const patientsService = {
    list: () => apiFetch<PatientListItem[]>(BASE_URL),
}