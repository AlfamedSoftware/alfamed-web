import { authBaseUrl } from "@/lib/auth"

export type AppointmentCalendarEvent = {
    id: string
    kind: "appointment" | "block"
    title: string
    start: string
    end: string
    color: string
    backgroundColor: string
    description?: string | null
    location?: string | null
    professionalId?: string | null
}

export type AppointmentAvailabilityWindow = {
    start: string
    end: string
}

export type AppointmentAvailabilityResult = {
    available: boolean
    windows: AppointmentAvailabilityWindow[]
}

export type CheckAvailabilityInput = {
    professionalId: string
    date: string
    durationMinutes?: number
    startAt?: string
    endAt?: string
}

export type CreateAppointmentInput = {
    patientId: string
    professionalId?: string
    startAt: string
    endAt: string
    reason?: string
}

export type ListAgendaEventsInput = {
    professionalIds?: string[]
    from: string
    to: string
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers)

    if (options?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    const response = await fetch(url, {
        ...options,
        cache: "no-store",
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

const BASE_URL = `${authBaseUrl}/appointments`

export const appointmentsService = {
    listAgendaEvents: ({ professionalIds, from, to }: ListAgendaEventsInput) => {
        const url = new URL(`${BASE_URL}/events`)

        if (professionalIds && professionalIds.length > 0) {
            url.searchParams.set("professionalIds", professionalIds.join(","))
        }

        url.searchParams.set("from", from)
        url.searchParams.set("to", to)

        return apiFetch<AppointmentCalendarEvent[]>(url.toString())
    },
    checkAvailability: (data: CheckAvailabilityInput) => {
        const url = new URL(`${BASE_URL}/availability`)
        url.searchParams.set("professionalId", data.professionalId)
        url.searchParams.set("date", data.date)

        if (typeof data.durationMinutes === "number") {
            url.searchParams.set("durationMinutes", String(data.durationMinutes))
        }

        if (data.startAt) {
            url.searchParams.set("startAt", data.startAt)
        }

        if (data.endAt) {
            url.searchParams.set("endAt", data.endAt)
        }

        return apiFetch<AppointmentAvailabilityResult>(url.toString())
    },
    create: (data: CreateAppointmentInput) =>
        apiFetch<{
            id: string
            patientId: string
            professionalUnitId: string
            startAt: string
            endAt: string
        }>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    get: (appointmentId: string) =>
        apiFetch<{
            id: string
            patientId: string
            professionalUnitId: string
            startAt: string
            endAt: string
            professionalId: string
        }>(`${BASE_URL}/${appointmentId}`),
    update: (appointmentId: string, data: Partial<CreateAppointmentInput>) =>
        apiFetch<{
            id: string
            patientId: string
            professionalUnitId: string
            startAt: string
            endAt: string
        }>(`${BASE_URL}/${appointmentId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    delete: (appointmentId: string) =>
        apiFetch<{ success: boolean }>(`${BASE_URL}/${appointmentId}`, {
            method: "DELETE",
        }),
}