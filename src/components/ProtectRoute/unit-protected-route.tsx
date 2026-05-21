import { Navigate } from "react-router"
import { Loading } from "@/components/Loading/loading"
import { useSessionUnit } from "@/contexts/session-unit-context"

interface UnitProtectedRouteProps {
    children: React.ReactNode
}

export function UnitProtectedRoute({ children }: UnitProtectedRouteProps) {
    const { sessionUnit, isLoading } = useSessionUnit()

    if (isLoading) {
        return <Loading fullScreen message="Validando unidade selecionada..." />
    }

    if (!sessionUnit?.selectedUnitId || !sessionUnit?.selectedProfessionalUnitId) {
        return <Navigate to="/session" replace />
    }

    return <>{children}</>
}
