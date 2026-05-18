import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarMenuProvider, useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useSession } from "@/hooks/use-session"
import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import { listProfessionalUnitRoles } from "@/services/professional-unit-roles.service"

interface SessionUnitsResponse {
    units: Array<{ id: string; name: string }>
    selectedUnitId?: string
    selectedProfessionalUnitId?: string
}

function SidebarBootstrap() {
    const { user, isLoading } = useSession()
    const location = useLocation()
    const { setMenuRoles, setIsMenuRolesLoading, setSelectedUnitName } = useSidebarMenu()
    const isAdminArea = location.pathname.startsWith("/admin")

    useEffect(() => {
        if (isLoading) {
            return
        }

        if (isAdminArea) {
            setMenuRoles([])
            setIsMenuRolesLoading(false)
            setSelectedUnitName(null)
            return
        }

        if (!user?.id) {
            setMenuRoles([])
            setIsMenuRolesLoading(false)
            setSelectedUnitName(null)
            return
        }

        const controller = new AbortController()

        const bootstrap = async () => {
            setIsMenuRolesLoading(true)

            try {
                const data = await fetchWithAuth<SessionUnitsResponse>(`${authBaseUrl}/session/units`)

                const selectedUnitId = typeof data.selectedUnitId === "string" && data.selectedUnitId.length > 0
                    ? data.selectedUnitId
                    : null
                const selectedProfessionalUnitId = typeof data.selectedProfessionalUnitId === "string" && data.selectedProfessionalUnitId.length > 0
                    ? data.selectedProfessionalUnitId
                    : null

                if (!selectedUnitId || !selectedProfessionalUnitId) {
                    setMenuRoles([])
                    setIsMenuRolesLoading(false)
                    setSelectedUnitName(null)
                    return
                }

                const selectedUnit = data.units.find((unit) => unit.id === selectedUnitId)
                setSelectedUnitName(selectedUnit?.name ?? null)

                const roleKeys = await listProfessionalUnitRoles({
                    requestUserId: user.id,
                    unitId: selectedUnitId,
                    professionalUnitId: selectedProfessionalUnitId,
                })

                if (!controller.signal.aborted) {
                    setMenuRoles(roleKeys)
                    setIsMenuRolesLoading(false)
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setMenuRoles([])
                    setIsMenuRolesLoading(false)
                    setSelectedUnitName(null)
                }
            }
        }

        void bootstrap()

        return () => controller.abort()
    }, [isAdminArea, isLoading, setIsMenuRolesLoading, setMenuRoles, setSelectedUnitName, user?.id])

    return null
}

export function SidebarLayout() {
    return (
        <SidebarMenuProvider>
            <SidebarBootstrap />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <Outlet />
                </SidebarInset>
            </SidebarProvider>
        </SidebarMenuProvider>
    )
}
