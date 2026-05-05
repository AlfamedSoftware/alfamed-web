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
    ChevronsUpDown,
    ClipboardList,
    Home as HomeIcon,
    Lock,
    LogOut,
    Settings,
    Stethoscope,
    User,
    Users,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { auth } from "@/lib/auth"
import { useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { Link, useLocation, useNavigate } from "react-router"
import type { LucideIcon } from "lucide-react"

type SidebarMenuItemConfig = {
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
        { title: "Inicio", icon: HomeIcon, url: "/home" },
        { title: "Pacientes", icon: Users, url: "/pacientes" },
        { title: "Profissionais", icon: Stethoscope, url: "/profissionais" },
    ],
    [MENU_ROLE_KEYS.administrative]: [
        { title: "Inicio", icon: HomeIcon, url: "/home" },
        { title: "Pacientes", icon: Users, url: "/pacientes" },
        { title: "Profissionais", icon: Stethoscope, url: "/profissionais" },
    ],
    [MENU_ROLE_KEYS.assistant]: [
        { title: "Inicio", icon: HomeIcon, url: "/home" },
        { title: "Agendamentos", icon: CalendarCheck, url: "/agendamentos" },
        { title: "Prontuários", icon: ClipboardList, url: "/prontuarios" },
    ],
    [MENU_ROLE_KEYS.medic]: [
        { title: "Inicio", icon: HomeIcon, url: "/home" },
        { title: "Configurações", icon: Settings, url: "/configuracoes" },
    ],
} as const

export function AppSidebar() {
    const { user, isLoading } = useSession()
    const navigate = useNavigate()
    const location = useLocation()
    const isAdminArea = location.pathname.startsWith("/admin")
    const { menuRoles } = useSidebarMenu()

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
                                        isActive={location.pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            {!isAdminArea && !hasMenuItems ? (
                                <SidebarMenuItem>
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        Nenhum cargo definido.<br />Entre em contato com o administrador.
                                    </div>
                                </SidebarMenuItem>
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
                                                <Users className="h-4 w-4" />
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
                                    <div className="flex flex-col justify-center items-start min-w-0 flex-1 ml-2 group-data-[collapsible=icon]:hidden">
                                        <span className="text-sm font-medium truncate w-full leading-tight">
                                            {isLoading ? "Carregando..." : user?.name || "Usuário"}
                                        </span>
                                        <span className="text-xs opacity-70 truncate w-full leading-tight">
                                            {isLoading ? "" : user?.email || ""}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="min-w-56 p-0"
                                align="end"
                                side="right"
                            >
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
                                        <span className="truncate text-xs text-muted-foreground">
                                            {isLoading ? "" : user?.email || ""}
                                        </span>
                                        {!isAdminArea ? (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {isLoading ? "" : currentRoleLabel ? `Cargo atual: ${currentRoleLabel}` : "Cargo não definido"}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <div className="p-1">
                                    {!isAdminArea ? (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to="/perfil">
                                                    <User className="h-4 w-4" />
                                                    Perfil
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link to="/session">
                                                    <HomeIcon className="h-4 w-4" />
                                                    Trocar unidade
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    ) : null}
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={handleLogout}
                                    >
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
