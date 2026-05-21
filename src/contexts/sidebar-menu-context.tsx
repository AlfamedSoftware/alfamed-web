import { createContext, useContext, useState, type ReactNode } from "react"

interface SidebarMenuContextValue {
    menuRoles: string[]
    setMenuRoles: (roles: string[]) => void
    isMenuRolesLoading: boolean
    setIsMenuRolesLoading: (loading: boolean) => void
}

const SidebarMenuContext = createContext<SidebarMenuContextValue | undefined>(undefined)

export function SidebarMenuProvider({ children }: { children: ReactNode }) {
    const [menuRoles, setMenuRoles] = useState<string[]>([])
    const [isMenuRolesLoading, setIsMenuRolesLoading] = useState(true)

    return (
        <SidebarMenuContext.Provider
            value={{
                menuRoles,
                setMenuRoles,
                isMenuRolesLoading,
                setIsMenuRolesLoading,
            }}
        >
            {children}
        </SidebarMenuContext.Provider>
    )
}

export function useSidebarMenu() {
    const context = useContext(SidebarMenuContext)

    if (!context) {
        throw new Error("useSidebarMenu must be used within SidebarMenuProvider")
    }

    return context
}