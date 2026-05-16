import { authBaseUrl } from "@/lib/auth"

export type AdminUnitOwner = {
    id: string
    name: string
    email: string
    cpf: string
    birthdate: string
    phone: string
    isActive: boolean
}

export type AdminUnit = {
    id: string
    name: string
    cnpj: string | null
    address: string | null
    city: string | null
    state: string | null
    phone: string | null
    email: string | null
    ownerUserId: string | null
    owner: AdminUnitOwner | null
    professionalsCount: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type AdminProfessional = {
    id: string
    userId: string
    unitId: string
    name: string
    email: string
    cpf: string
    birthdate: string
    phone: string
    crm: string | null
    specialtyIds: string[]
    status: boolean
    createdAt: string
    updatedAt: string
}

export type CreateAdminUnitInput = {
    name: string
    cnpj: string
    address: string
    city: string
    state: string
    phone: string
    email: string
    isActive?: boolean
    owner: {
        name: string
        email: string
        cpf: string
        birthdate: string
        phone: string
        password: string
        status?: boolean
    }
}

export type UpdateAdminUnitInput = Partial<
    Pick<
        CreateAdminUnitInput,
        "name" | "cnpj" | "address" | "city" | "state" | "phone" | "email" | "isActive"
    >
> & {
    ownerUserId?: string | null
}

export type CreateAdminProfessionalInput = {
    user: {
        name: string
        email: string
        cpf: string
        birthdate: string
        phone: string
        password: string
        status?: boolean
    }
    crm: string
    specialtyIds?: string[]
}

const BASE_URL = `${authBaseUrl}/admin/units`

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers)

    // Only send JSON content type when we actually send a request body.
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

export const adminUnitsService = {
    list: () => apiFetch<AdminUnit[]>(BASE_URL),
    getById: (id: string) => apiFetch<AdminUnit>(`${BASE_URL}/${id}`),
    create: (data: CreateAdminUnitInput) =>
        apiFetch<AdminUnit>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    update: (id: string, data: UpdateAdminUnitInput) =>
        apiFetch<AdminUnit>(`${BASE_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    listProfessionals: (unitId: string) =>
        apiFetch<AdminProfessional[]>(`${BASE_URL}/${unitId}/professionals`),
    createProfessional: (unitId: string, data: CreateAdminProfessionalInput) =>
        apiFetch<AdminProfessional>(`${BASE_URL}/${unitId}/professionals`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
}
