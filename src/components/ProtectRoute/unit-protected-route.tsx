import { Navigate } from "react-router"
import { Loading } from "@/components/Loading/loading"
import { authBaseUrl } from "@/lib/auth"
import { useEffect, useState } from "react"

interface UnitProtectedRouteProps {
    children: React.ReactNode
}

export function UnitProtectedRoute({ children }: UnitProtectedRouteProps) {
    const [isCheckingClinic, setIsCheckingClinic] = useState(true)
    const [hasClinicSelected, setHasClinicSelected] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(true)

    useEffect(() => {
        const controller = new AbortController()

        const checkSelectedClinic = async () => {
            setIsCheckingClinic(true)

            try {
                const response = await fetch(`${authBaseUrl}/session/clinics`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    signal: controller.signal,
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        setIsAuthenticated(false)
                    }
                    setHasClinicSelected(false)
                    return
                }

                const data = (await response.json()) as { selectedClinicId?: string }
                setIsAuthenticated(true)
                setHasClinicSelected(typeof data.selectedClinicId === "string" && data.selectedClinicId.length > 0)
            } catch {
                if (!controller.signal.aborted) {
                    setHasClinicSelected(false)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsCheckingClinic(false)
                }
            }
        }

        void checkSelectedClinic()

        return () => controller.abort()
    }, [])

    if (isCheckingClinic) {
        return <Loading fullScreen message="Validando unidade selecionada..." />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (!hasClinicSelected) {
        return <Navigate to="/session" replace />
    }

    return <>{children}</>
}
