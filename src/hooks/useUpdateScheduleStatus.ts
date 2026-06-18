import { useState } from "react"
import { attendanceService } from "@/services/attendance.service"

export function useUpdateScheduleStatus() {
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updateStatus = async (scheduleId: string, status: "in_progress" | "done" | "cancelled") => {
        setIsUpdating(true)
        setError(null)

        try {
            return await attendanceService.updateScheduleStatus(scheduleId, status)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Falha ao atualizar status"
            setError(message)
            throw err
        } finally {
            setIsUpdating(false)
        }
    }

    return { updateStatus, isUpdating, error }
}
