import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

export interface ExamRequestItem {
    id: string
    procedureId: string
    description: string
    kind: "internal" | "external"
    statusCode: number | null
    statusDescription: string | null
}

export const requestsService = {
    saveFromAppointment: (
        appointmentId: string,
        procedureIds: string[],
    ): Promise<{ message: string }> =>
        fetchWithAuth<{ message: string }>(`${authBaseUrl}/requests/save-from-appointment`, {
            method: "POST",
            body: JSON.stringify({ appointmentId, procedureIds }),
        }),
    listByAppointment: (appointmentId: string): Promise<ExamRequestItem[]> =>
        fetchWithAuth<ExamRequestItem[]>(`${authBaseUrl}/requests/by-appointment/${appointmentId}`),
}
