import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarMenuProvider, useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"

function SidebarBootstrap() {
    const location = useLocation()
    const { sessionUnit, isLoading } = useSessionUnit()
    const { setMenuRoles, setIsMenuRolesLoading } = useSidebarMenu()
    const isAdminArea = location.pathname.startsWith("/admin")

    useEffect(() => {
        if (isLoading) {
            setIsMenuRolesLoading(true)
            return
        }

        if (isAdminArea) {
            setMenuRoles([])
            setIsMenuRolesLoading(false)
            return
        }

        const selectedRoleKey = sessionUnit?.selectedRoles?.key

        if (!sessionUnit?.selectedUnitId || !sessionUnit?.selectedProfessionalUnitId) {
            setMenuRoles([])
            setIsMenuRolesLoading(false)
            return
        }

        // Try to fetch the full list of roles for the selected unit to avoid only-getting the first role
        (async () => {
            try {
                console.log("SidebarBootstrap: sessionUnit=", sessionUnit, "selectedRoleKey=", selectedRoleKey)
                const units = await fetchWithAuth(`${authBaseUrl}/session/list-units-acessable-by-professional`) as { units?: Array<{ id: string; name?: string; roles?: Array<{ id?: string; key?: string; description?: string }> }> }
                console.log("SidebarBootstrap: fetched units=", units)
                const unit = Array.isArray(units?.units) ? units.units.find((u) => u.id === sessionUnit?.selectedUnitId) : null

                const roleKeys: string[] = unit && Array.isArray(unit.roles) ? unit.roles.map((r) => String(r.key)) : (selectedRoleKey ? [String(selectedRoleKey)] : [])
                console.log("SidebarBootstrap: resolved roleKeys=", roleKeys)

                const alfamedInternalVariants = new Set([
                    "internal_alfamed",
                    "alfamed",
                    "alfamed interno",
                    "alfamed_interno",
                ].map((s) => s.toLowerCase()))

                const hasAlfamed = roleKeys.some((k) => alfamedInternalVariants.has(String(k).toLowerCase()))

                if (hasAlfamed) {
                    setMenuRoles(["internal_alfamed", "administrative", "administrative_assistant", "medic"])
                } else {
                    setMenuRoles(roleKeys)
                }
                setIsMenuRolesLoading(false)
            } catch {
                const alfamedInternalVariants = new Set([
                    "internal_alfamed",
                    "alfamed",
                    "alfamed interno",
                    "alfamed_interno",
                ].map((s) => s.toLowerCase()))

                if (selectedRoleKey && alfamedInternalVariants.has(String(selectedRoleKey).toLowerCase())) {
                    setMenuRoles(["internal_alfamed", "administrative", "administrative_assistant", "medic"])
                } else if (selectedRoleKey) {
                    setMenuRoles([String(selectedRoleKey)])
                } else {
                    setMenuRoles([])
                }
                setIsMenuRolesLoading(false)
            }
        })()
    }, [isAdminArea, isLoading, sessionUnit, setIsMenuRolesLoading, setMenuRoles])

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
