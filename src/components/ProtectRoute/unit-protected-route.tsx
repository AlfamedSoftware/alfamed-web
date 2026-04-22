import { Navigate } from "react-router"
import { Loading } from "@/components/Loading/loading"
import { useSession } from "@/hooks/use-session"
import { getSelectedUnit } from "@/lib/selected-unit"

interface UnitProtectedRouteProps {
    children: React.ReactNode
}

export function UnitProtectedRoute({ children }: UnitProtectedRouteProps) {
    const { session, user, isLoading } = useSession()

    if (isLoading) {
        return <Loading fullScreen message="Validando unidade selecionada..." />
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    const userId =
        user && typeof user === "object" && typeof (user as Record<string, unknown>).id === "string"
            ? ((user as Record<string, unknown>).id as string)
            : ""

    if (!userId) {
        return <Navigate to="/session" replace />
    }

    const selectedUnit = getSelectedUnit(userId)
    if (!selectedUnit) {
        return <Navigate to="/session" replace />
    }

    return <>{children}</>
}
