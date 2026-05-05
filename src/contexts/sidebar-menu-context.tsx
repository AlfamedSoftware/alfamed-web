import { createContext, useContext, useState, type ReactNode } from "react"

interface SidebarMenuContextValue {
    menuRoles: string[]
    setMenuRoles: (roles: string[]) => void
    selectedUnitName: string | null
    setSelectedUnitName: (name: string | null) => void
}

const SidebarMenuContext = createContext<SidebarMenuContextValue | undefined>(undefined)

export function SidebarMenuProvider({ children }: { children: ReactNode }) {
    const [menuRoles, setMenuRoles] = useState<string[]>([])
    const [selectedUnitName, setSelectedUnitName] = useState<string | null>(null)

    return (
        <SidebarMenuContext.Provider
            value={{
                menuRoles,
                setMenuRoles,
                selectedUnitName,
                setSelectedUnitName,
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