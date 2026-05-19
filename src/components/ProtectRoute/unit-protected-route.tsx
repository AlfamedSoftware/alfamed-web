import { Navigate } from "react-router"
import { Loading } from "@/components/Loading/loading"
import { authBaseUrl } from "@/lib/auth"
import { useEffect, useState } from "react"

interface UnitProtectedRouteProps {
    children: React.ReactNode
}

export function UnitProtectedRoute({ children }: UnitProtectedRouteProps) {
    const [isCheckingUnit, setIsCheckingUnit] = useState(true)
    const [hasUnitSelected, setHasUnitSelected] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(true)

    useEffect(() => {
        const controller = new AbortController()

        const checkSelectedUnit = async () => {
            setIsCheckingUnit(true)

            try {
                const response = await fetch(`${authBaseUrl}/session/units`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    signal: controller.signal,
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        setIsAuthenticated(false)
                    }
                    setHasUnitSelected(false)
                    return
                }

                const data = (await response.json()) as { selectedUnitId?: string; selectedProfessionalUnitId?: string }
                setIsAuthenticated(true)
                const hasUnitId = typeof data.selectedUnitId === "string" && data.selectedUnitId.length > 0
                const hasProfessionalUnitId = typeof data.selectedProfessionalUnitId === "string" && data.selectedProfessionalUnitId.length > 0
                setHasUnitSelected(hasUnitId && hasProfessionalUnitId)
            } catch {
                if (!controller.signal.aborted) {
                    setHasUnitSelected(false)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsCheckingUnit(false)
                }
            }
        }

        void checkSelectedUnit()

        return () => controller.abort()
    }, [])

    if (isCheckingUnit) {
        return <Loading fullScreen message="Validando unidade selecionada..." />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (!hasUnitSelected) {
        return <Navigate to="/selecao-unidade" replace />
    }

    return <>{children}</>
}
