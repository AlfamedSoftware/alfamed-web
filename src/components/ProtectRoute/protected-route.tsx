import { Navigate } from "react-router"
import { useSession } from "@/hooks/use-session"
import { Loading } from "@/components/Loading/loading"

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { session, isLoading } = useSession()

    if (isLoading) {
        return <Loading fullScreen message="Verificando suas credenciais..." />
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
