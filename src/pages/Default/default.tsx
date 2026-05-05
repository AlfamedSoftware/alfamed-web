import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarMenuProvider, useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useSession } from "@/hooks/use-session"
import { authBaseUrl } from "@/lib/auth"
import { listProfessionalUnitRoles } from "@/services/professional-unit-roles.service"

interface SessionClinicsResponse {
    clinics: Array<{ id: string; name: string }>
    selectedClinicId?: string
    selectedProfessionalUnitId?: string
}

function DefaultBootstrap() {
    const { user, isLoading } = useSession()
    const location = useLocation()
    const isAdminArea = location.pathname.startsWith("/admin")
    const { setMenuRoles, setSelectedUnitName } = useSidebarMenu()

    useEffect(() => {
        if (isLoading) {
            return
        }

        // Se estivermos na área admin, não carregamos roles/unidade
        if (isAdminArea) {
            setMenuRoles([])
            setSelectedUnitName(null)
            return
        }

        const controller = new AbortController()

        const bootstrap = async () => {
            try {
                const response = await fetch(`${authBaseUrl}/session/clinics`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    signal: controller.signal,
                })

                if (!response.ok) {
                    setMenuRoles([])
                    setSelectedUnitName(null)
                    return
                }

                const data = (await response.json()) as SessionClinicsResponse
                const selectedClinic = data.clinics.find((clinic) => clinic.id === data.selectedClinicId)
                setSelectedUnitName(selectedClinic?.name ?? null)

                const selectedClinicId = typeof data.selectedClinicId === "string" ? data.selectedClinicId : null
                const selectedProfessionalUnitId =
                    typeof data.selectedProfessionalUnitId === "string" ? data.selectedProfessionalUnitId : null

                if (!selectedClinicId || !selectedProfessionalUnitId) {
                    setMenuRoles([])
                    return
                }

                const roleKeys = await listProfessionalUnitRoles({
                    requestUserId: user.id,
                    unitId: selectedClinicId,
                    professionalUnitId: selectedProfessionalUnitId,
                })

                if (!controller.signal.aborted) {
                    setMenuRoles(roleKeys)
                }
            } catch {
                if (!controller.signal.aborted) {
                    setMenuRoles([])
                    setSelectedUnitName(null)
                }
            }
        }

        void bootstrap()

        return () => controller.abort()
    }, [isLoading, isAdminArea, setMenuRoles, setSelectedUnitName, user?.id])

    return null
}

export function Default() {
    return (
        <SidebarMenuProvider>
            <DefaultBootstrap />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <Outlet />
                </SidebarInset>
            </SidebarProvider>
        </SidebarMenuProvider>
    )
}
