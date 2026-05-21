import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useLocation } from "react-router"
import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

interface SessionUnitRole {
    id: string
    description: string
    key: string
}

export interface SessionUnitData {
    selectedUnitId?: string
    selectedUnitName?: string
    selectedProfessionalUnitId?: string
    selectedRoles?: SessionUnitRole
}

interface SessionUnitContextValue {
    sessionUnit: SessionUnitData | null
    isLoading: boolean
    refreshSessionUnit: () => Promise<void>
}

const SessionUnitContext = createContext<SessionUnitContextValue | undefined>(undefined)

const isPublicRoute = (pathname: string) =>
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/session") ||
    pathname.startsWith("/admin")

export function SessionUnitProvider({ children }: { children: ReactNode }) {
    const location = useLocation()
    const [sessionUnit, setSessionUnit] = useState<SessionUnitData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoadedSessionUnit, setHasLoadedSessionUnit] = useState(false)

    const loadSessionUnit = useCallback(async () => {
        setIsLoading(true)

        try {
            const data = await fetchWithAuth<SessionUnitData>(`${authBaseUrl}/session/get-session-unit`)

            if (
                typeof data.selectedUnitId === "string" && data.selectedUnitId.length > 0 &&
                typeof data.selectedProfessionalUnitId === "string" && data.selectedProfessionalUnitId.length > 0
            ) {
                setSessionUnit({
                    selectedUnitId: data.selectedUnitId,
                    selectedUnitName: typeof data.selectedUnitName === "string" && data.selectedUnitName.length > 0
                        ? data.selectedUnitName
                        : undefined,
                    selectedProfessionalUnitId: data.selectedProfessionalUnitId,
                    selectedRoles: data.selectedRoles,
                })
            } else {
                setSessionUnit(null)
            }

            setHasLoadedSessionUnit(true)
        } catch {
            setSessionUnit(null)
            setHasLoadedSessionUnit(true)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (hasLoadedSessionUnit) {
            return
        }

        if (isPublicRoute(location.pathname)) {
            setSessionUnit(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        void loadSessionUnit()
    }, [hasLoadedSessionUnit, location.pathname, loadSessionUnit])

    const refreshSessionUnit = useCallback(async () => {
        setHasLoadedSessionUnit(false)
        await loadSessionUnit()
    }, [loadSessionUnit])

    const value = useMemo(
        () => ({
            sessionUnit,
            isLoading,
            refreshSessionUnit,
        }),
        [sessionUnit, isLoading, refreshSessionUnit],
    )

    return <SessionUnitContext.Provider value={value}>{children}</SessionUnitContext.Provider>
}

export function useSessionUnit() {
    const context = useContext(SessionUnitContext)

    if (!context) {
        throw new Error("useSessionUnit must be used within SessionUnitProvider")
    }

    return context
}
