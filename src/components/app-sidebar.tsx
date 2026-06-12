import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    CalendarCheck,
    CalendarDays,
    ChevronsUpDown,
    ClipboardList,
    Home as HomeIcon,
    Lock,
    LogOut,
    Stethoscope,
    User,
    Building2,
    ClipboardPaste,
    Minus,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { auth } from "@/lib/auth"
import { useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { Link, useLocation, useNavigate } from "react-router"
import type { LucideIcon } from "lucide-react"

type SidebarMenuItemConfig = {
    title: string
    icon: LucideIcon
    url: string
}

type SidebarMenuSubItemConfig = {
    title: string
    icon: LucideIcon
    url: string
}

const MENU_ROLE_KEYS = {
    alfamed: "internal_alfamed",
    administrative: "administrative",
    assistant: "administrative_assistant",
    medic: "medic",
} as const

type RoleMenuKey = (typeof MENU_ROLE_KEYS)[keyof typeof MENU_ROLE_KEYS]

const allowedRoleKeys = new Set<RoleMenuKey>(Object.values(MENU_ROLE_KEYS))

const roleLabels: Record<RoleMenuKey, string> = {
    [MENU_ROLE_KEYS.alfamed]: "Alfamed",
    [MENU_ROLE_KEYS.administrative]: "Administrativo",
    [MENU_ROLE_KEYS.assistant]: "Assistente administrativo",
    [MENU_ROLE_KEYS.medic]: "Médico",
}

const menuItemsByRole: Record<RoleMenuKey, SidebarMenuItemConfig[]> = {
    [MENU_ROLE_KEYS.alfamed]: [
        { title: "Início", icon: HomeIcon, url: "/home" },
        { title: "Unidade", icon: Building2, url: "/unidade" },
        { title: "Profissionais", icon: User, url: "/profissionais" },
        { title: "Procedimentos", icon: ClipboardList, url: "/procedimentos" },
        { title: "Especialidades", icon: Stethoscope, url: "/especialidades" },
        { title: "", icon: Minus, url: "" },
        { title: "Agendas", icon: CalendarDays, url: "/agenda-listagem-profissionais" },
        { title: "Agendamentos", icon: CalendarCheck, url: "/agendas" },    
    ],
    [MENU_ROLE_KEYS.administrative]: [
        { title: "Início", icon: HomeIcon, url: "/home" },
        { title: "Unidade", icon: Building2, url: "/unidade" },
        { title: "Profissionais", icon: User, url: "/profissionais" },
        { title: "Procedimentos", icon: ClipboardList, url: "/procedimentos" },
        { title: "Especialidades", icon: Stethoscope, url: "/especialidades" },
        { title: "", icon: Minus, url: "" },
        { title: "Agendas", icon: CalendarDays, url: "/agenda-listagem-profissionais" },
        { title: "Agendamentos", icon: CalendarCheck, url: "/agendas" },  
    ],
    [MENU_ROLE_KEYS.medic]: [
        { title: "Início", icon: HomeIcon, url: "/home" },
        { title: "Agendas", icon: CalendarDays, url: "/agenda-listagem-profissionais" },
        { title: "Agendamentos", icon: CalendarCheck, url: "/agendas" },
    ],
    [MENU_ROLE_KEYS.assistant]: [
        { title: "Início", icon: HomeIcon, url: "/home" },
        { title: "Agendas", icon: CalendarDays, url: "/agenda-listagem-profissionais" },
        { title: "Agendamentos", icon: CalendarCheck, url: "/agendas" },
    ],
} as const

const professionalsSubmenu: SidebarMenuSubItemConfig[] = [
    { title: "Vínculo de Especialidades", icon: ClipboardPaste, url: "/profissionais/vinculo-especialidades" },
]

export function AppSidebar() {
    const { user, isLoading } = useSession()
    const navigate = useNavigate()
    const location = useLocation()
    const isAdminArea = location.pathname.startsWith("/admin")
    const isProfessionalAgendaRoute =
        location.pathname.startsWith("/profissionais/") &&
        new URLSearchParams(location.search).get("isAgenda") === "true"
    const { sessionUnit, isLoading: isSessionUnitLoading } = useSessionUnit()
    const { menuRoles, isMenuRolesLoading } = useSidebarMenu()
    const isSidebarDataLoading = isLoading || isSessionUnitLoading

    if (isSidebarDataLoading) {
        return null
    }

    const menuItemsForRoles = menuRoles.flatMap((role) =>
        allowedRoleKeys.has(role as RoleMenuKey)
            ? menuItemsByRole[role as RoleMenuKey]
            : [],
    )
    const menuItems = Array.from(new Map<string, SidebarMenuItemConfig>(menuItemsForRoles.map((item) => [item.url, item])).values())
    const activeRoleKey = menuRoles.find((role) => allowedRoleKeys.has(role as RoleMenuKey)) as RoleMenuKey | undefined
    const currentRoleLabel = activeRoleKey ? roleLabels[activeRoleKey] : null
    const hasMenuItems = menuItems.length > 0

    const handleLogout = async () => {
        await auth.signOut()
        navigate("/login", { replace: true })
    }

    const isMenuItemActive = (item: SidebarMenuItemConfig) => {
        if (isProfessionalAgendaRoute) {
            return item.url === "/agenda-listagem-profissionais"
        }

        return location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)
    }

    const getUserInitial = () => {
        if (!user?.name) return "U"
        return user.name.charAt(0).toUpperCase()
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isMenuItemActive(item)}
                                        tooltip={item.title}
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>

                                    {item.title === "Profissionais" ? (
                                        <SidebarMenuSub>
                                            {professionalsSubmenu.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuButton asChild size="sm" tooltip={subItem.title}>
                                                        <Link to={subItem.url}>
                                                            <subItem.icon className="h-4 w-4" />
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    ) : null}
                                </SidebarMenuItem>
                            ))}
                            {!isAdminArea && !hasMenuItems ? (
                                isMenuRolesLoading ? (
                                    <>
                                        <SidebarMenuItem>
                                            <SidebarMenuSkeleton showIcon />
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuSkeleton showIcon />
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuSkeleton showIcon />
                                        </SidebarMenuItem>
                                    </>
                                ) : (
                                    <SidebarMenuItem>
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                            Nenhum cargo definido.<br />Entre em contato com o administrador.
                                        </div>
                                    </SidebarMenuItem>
                                )
                            ) : null}
                            {isAdminArea ? (
                                <>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location.pathname.startsWith("/admin/unidades")}
                                            tooltip="Admin/Interno"
                                        >
                                            <Link to="/admin/unidades">
                                                <Lock className="h-4 w-4" />
                                                <span>Central de Unidades</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location.pathname.startsWith("/admin/upm")}
                                            tooltip="UPM"
                                        >
                                            <Link to="/admin/upm">
                                                <User className="h-4 w-4" />
                                                <span>UPM</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </>
                            ) : null}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton tooltip="Conta" size="lg" className="cursor-pointer">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                                        <span className="text-sm font-semibold">
                                            {isLoading ? "..." : getUserInitial()}
                                        </span>
                                    </div>
                                    <div className="ml-2 flex min-w-0 flex-1 flex-col items-start justify-center group-data-[collapsible=icon]:hidden">
                                        <span className="w-full truncate text-sm font-medium leading-tight">
                                            {isLoading ? "Carregando..." : user?.name || "Usuário"}
                                        </span>
                                        {isAdminArea ? (
                                            <span className="w-full truncate text-xs opacity-70 leading-tight">
                                                ServiceDesk
                                            </span>
                                        ) : (
                                            <span className="w-full truncate text-xs opacity-70 leading-tight">
                                                {isSessionUnitLoading ? "Carregando unidade..." : sessionUnit?.selectedUnitName || "Unidade selecionada"}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-56 p-0" align="end" side="right">
                                <div className="flex items-center gap-2 p-2">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <span className="text-sm font-semibold">
                                            {isLoading ? "..." : getUserInitial()}
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col truncate">
                                        <span className="truncate text-sm font-medium">
                                            {isLoading ? "Carregando..." : user?.name || "Usuário"}
                                        </span>
                                        {isAdminArea ? (
                                            <span className="truncate text-xs text-muted-foreground">
                                                ServiceDesk
                                            </span>
                                        ) : (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {isSessionUnitLoading ? "Carregando unidade..." : sessionUnit?.selectedUnitName ? `Unidade: ${sessionUnit.selectedUnitName}` : "Unidade: Não selecionada"}
                                            </span>
                                        )}
                                        {isAdminArea ? (
                                            <span className="truncate text-xs text-muted-foreground">
                                                Alfamed
                                            </span>
                                        ) : (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {isMenuRolesLoading ? "Carregando cargo..." : currentRoleLabel ? `Cargo: ${currentRoleLabel}` : "Cargo: Não definido"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <div className="p-1">
                                    {!isAdminArea ? (
                                        <>
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link to="/perfil">
                                                    <User className="h-4 w-4" />
                                                    Perfil
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link to="/session">
                                                    <HomeIcon className="h-4 w-4" />
                                                    Trocar unidade
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    ) : null}
                                    <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
                                        <LogOut className="h-4 w-4" />
                                        Sair
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
