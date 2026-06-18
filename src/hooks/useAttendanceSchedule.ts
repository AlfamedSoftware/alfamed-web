import { useCallback, useEffect, useState } from "react"
import { attendanceService, type AttendanceScheduleDetails } from "@/services/attendance.service"

export function useAttendanceSchedule(scheduleId?: string) {
    const [schedule, setSchedule] = useState<AttendanceScheduleDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!scheduleId) {
            setSchedule(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            setSchedule(await attendanceService.getSchedule(scheduleId))
        } catch (err) {
            setSchedule(null)
            setError(err instanceof Error ? err.message : "Falha ao carregar atendimento")
        } finally {
            setIsLoading(false)
        }
    }, [scheduleId])

    useEffect(() => {
        void refetch()
    }, [refetch])

    return { schedule, isLoading, error, refetch }
}
