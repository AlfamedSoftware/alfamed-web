import { useCallback, useEffect, useState } from "react"
import { attendanceService, type AttendanceSpecialty } from "@/services/attendance.service"

export function useAttendanceSchedules(date: string, specialtyId?: string) {
    const [specialties, setSpecialties] = useState<AttendanceSpecialty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!date) {
            setSpecialties([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const data = await attendanceService.listSchedules({ date, specialtyId })
            setSpecialties(data.specialties)
        } catch (err) {
            setSpecialties([])
            setError(err instanceof Error ? err.message : "Falha ao carregar atendimentos")
        } finally {
            setIsLoading(false)
        }
    }, [date, specialtyId])

    useEffect(() => {
        void refetch()
    }, [refetch])

    return { specialties, isLoading, error, refetch }
}
