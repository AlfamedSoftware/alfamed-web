import { authBaseUrl } from "@/lib/auth"

export type AttendanceScheduleStatus = "scheduled" | "in_progress" | "done" | "cancelled" | string

export type AttendanceSchedule = {
    id: string
    startAt: string
    endAt: string
    status: AttendanceScheduleStatus
    patient: {
        id: string
        name: string
        birthDate: string
        gender: string | null
    }
}

export type AttendanceSpecialty = {
    id: string
    name: string
    schedules: AttendanceSchedule[]
}

export type AttendanceSchedulesResponse = {
    specialties: AttendanceSpecialty[]
}

export type AttendanceScheduleDetails = {
    id: string
    startAt: string
    endAt: string
    status: AttendanceScheduleStatus
    specialtyId: string
    specialtyName: string
    patient: {
        id: string
        name: string
        birthDate: string
        gender: string | null
        phone: string | null
        email: string | null
        complaints: string | null
    }
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

const BASE_URL = `${authBaseUrl}/attendance`

export const attendanceService = {
    listSchedules: ({ date, specialtyId }: { date: string; specialtyId?: string }) => {
        const url = new URL(`${BASE_URL}/schedules`)
        url.searchParams.set("date", date)

        if (specialtyId) {
            url.searchParams.set("specialtyId", specialtyId)
        }

        return apiFetch<AttendanceSchedulesResponse>(url.toString())
    },
    getSchedule: (scheduleId: string) =>
        apiFetch<AttendanceScheduleDetails>(`${BASE_URL}/schedules/${scheduleId}`),
    updateScheduleStatus: (scheduleId: string, status: "in_progress" | "done" | "cancelled") =>
        apiFetch<{ id: string; status: string }>(`${BASE_URL}/schedules/${scheduleId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }),
}
