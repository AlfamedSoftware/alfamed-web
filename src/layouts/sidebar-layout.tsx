import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarMenuProvider, useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useSessionUnit } from "@/contexts/session-unit-context"

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

        if (!sessionUnit?.selectedUnitId || !sessionUnit?.selectedProfessionalUnitId || !selectedRoleKey) {
            setMenuRoles([])
            setIsMenuRolesLoading(false)
            return
        }

        setMenuRoles([selectedRoleKey])
        setIsMenuRolesLoading(false)
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
