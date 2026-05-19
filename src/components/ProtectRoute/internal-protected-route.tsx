import { Navigate, useLocation } from "react-router"
import { Loading } from "@/components/Loading/loading"
import { useSession } from "@/hooks/use-session"

interface InternalProtectedRouteProps {
    children: React.ReactNode
}

export function InternalProtectedRoute({ children }: InternalProtectedRouteProps) {
    const { session, user, isLoading, isInternalUser } = useSession()
    const location = useLocation()

    if (isLoading) {
        return <Loading fullScreen message="Validando acesso interno..." />
    }

    if (!session || !user) {
        return <Navigate to="/admin/login" replace state={{ error: "Faça login para acessar a área interna." }} />
    }

    if (!isInternalUser) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{
                    error: "Acesso permitido apenas para e-mails @alfamed.com.",
                    from: location.pathname,
                }}
            />
        )
    }

    return <>{children}</>
}
