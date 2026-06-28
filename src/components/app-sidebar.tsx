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
    CalendarDays,
    ChevronsUpDown,
    ClipboardList,
    Home as HomeIcon,
    Lock,
    LogOut,
    Stethoscope,
    User,
    Building2,
    HeartPulse,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { auth } from "@/lib/auth"
import { useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { Link, useLocation, useNavigate } from "react-router"
import type { LucideIcon } from "lucide-react"

// ─── Types & Role Config ────────────────────────────────────────────────────

type SidebarMenuItemConfig = {
    title: string
    icon: LucideIcon
    url: string
}

const MENU_ROLE_KEYS = {
    administrative: "administrative",
    assistant: "administrative_assistant",
    medic: "medic",
    technical_executor: "technical_executor",
} as const

type RoleMenuKey = (typeof MENU_ROLE_KEYS)[keyof typeof MENU_ROLE_KEYS]

const allowedRoleKeys = new Set<RoleMenuKey>(Object.values(MENU_ROLE_KEYS))

const roleLabels: Record<RoleMenuKey, string> = {
    [MENU_ROLE_KEYS.administrative]: "Administrativo",
    [MENU_ROLE_KEYS.assistant]: "Assistente administrativo",
    [MENU_ROLE_KEYS.medic]: "Médico",
    [MENU_ROLE_KEYS.technical_executor]: "Técnico Executante",
}

// ─── Menu Definitions ───────────────────────────────────────────────────────

const ADMINISTRATIVE_MENU_ITEMS: SidebarMenuItemConfig[] = [
    { title: "Início", icon: HomeIcon, url: "/home" },
    { title: "Unidade", icon: Building2, url: "/unidade" },
    { title: "Profissionais", icon: User, url: "/profissionais" },
    { title: "Especialidades", icon: Stethoscope, url: "/especialidades" },
    //Vínculo ficara desativado pois não está pronto para adicionar na busca da agenda
    //{ title: "Vínculo de Especialidades", icon: ClipboardPaste, url: "/especialidades/vinculo-listagem-profissionais" },
    { title: "Procedimentos", icon: ClipboardList, url: "/procedimentos" },
    { title: "Agendas", icon: CalendarDays, url: "/agendas" },
]

const CLINICAL_MENU_ITEMS: SidebarMenuItemConfig[] = [
    { title: "Início", icon: HomeIcon, url: "/home" },
    { title: "Agendas", icon: CalendarDays, url: "/agendas" },
]

const MEDICAL_MENU_ITEMS: SidebarMenuItemConfig[] = [
    { title: "Início", icon: HomeIcon, url: "/home" },
    { title: "Agendas", icon: CalendarDays, url: "/agendas" },
    { title: "Atendimentos", icon: HeartPulse, url: "/atendimentos" },
    { title: "Prontuário", icon: ClipboardList, url: "/prontuario" },
]

const TECHNICAL_EXECUTOR_MENU_ITEMS: SidebarMenuItemConfig[] = [
    { title: "Início", icon: HomeIcon, url: "/home" },
    { title: "Atendimentos?", icon: CalendarDays, url: "/atendimentosgestao" },
]

const menuItemsByRole: Record<RoleMenuKey, SidebarMenuItemConfig[]> = {
    [MENU_ROLE_KEYS.administrative]: ADMINISTRATIVE_MENU_ITEMS,
    [MENU_ROLE_KEYS.medic]: MEDICAL_MENU_ITEMS,
    [MENU_ROLE_KEYS.assistant]: CLINICAL_MENU_ITEMS,
    [MENU_ROLE_KEYS.technical_executor]: TECHNICAL_EXECUTOR_MENU_ITEMS,
} as const

// ─── Sub-components ─────────────────────────────────────────────────────────

function AdminSidebarMenu({ pathname }: { pathname: string }) {
    return (
        <>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin/unidades")}
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
                    isActive={pathname.startsWith("/admin/upm")}
                    tooltip="UPM"
                >
                    <Link to="/admin/upm">
                        <User className="h-4 w-4" />
                        <span>UPM</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </>
    )
}

function RegularSidebarMenu({
    menuItems,
    isMenuRolesLoading,
    hasMenuItems,
    isMenuItemActive,
}: {
    menuItems: SidebarMenuItemConfig[]
    isMenuRolesLoading: boolean
    hasMenuItems: boolean
    isMenuItemActive: (item: SidebarMenuItemConfig) => boolean
}) {
    if (!hasMenuItems) {
        if (isMenuRolesLoading) {
            return (
                <>
                    <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                </>
            )
        }
        return (
            <SidebarMenuItem>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhum cargo definido.<br />Entre em contato com o administrador.
                </div>
            </SidebarMenuItem>
        )
    }

    return (
        <>
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
                </SidebarMenuItem>
            ))}
        </>
    )
}

function SidebarUserFooter({
    user,
    isLoading,
    isAdminArea,
    unitName,
    isSessionUnitLoading,
    isMenuRolesLoading,
    currentRoleLabel,
    onLogout,
}: {
    user: { name?: string | null } | null
    isLoading: boolean
    isAdminArea: boolean
    unitName: string | null | undefined
    isSessionUnitLoading: boolean
    isMenuRolesLoading: boolean
    currentRoleLabel: string | null
    onLogout: () => void
}) {
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U"

    return (
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip="Conta" size="lg" className="cursor-pointer">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                                    <span className="text-sm font-semibold">
                                        {isLoading ? "..." : initial}
                                    </span>
                                </div>
                                <div className="ml-2 flex min-w-0 flex-1 flex-col items-start justify-center group-data-[collapsible=icon]:hidden">
                                    <span className="w-full truncate text-sm font-medium leading-tight">
                                        {isLoading ? "Carregando..." : user?.name || "Usuário"}
                                    </span>
                                    <span className="w-full truncate text-xs opacity-70 leading-tight">
                                        {isAdminArea
                                            ? "ServiceDesk"
                                            : isSessionUnitLoading
                                                ? "Carregando unidade..."
                                                : unitName || "Unidade selecionada"}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="min-w-56 p-0" align="end" side="right">
                            <div className="flex items-center gap-2 p-2">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <span className="text-sm font-semibold">
                                        {isLoading ? "..." : initial}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col truncate">
                                    <span className="truncate text-sm font-medium">
                                        {isLoading ? "Carregando..." : user?.name || "Usuário"}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {isAdminArea
                                            ? "Alfamed"
                                            : isSessionUnitLoading
                                                ? "Carregando unidade..."
                                                : unitName
                                                    ? `Unidade: ${unitName}`
                                                    : "Unidade: Não selecionada"}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {isAdminArea
                                            ? "ServiceDesk"
                                            : isMenuRolesLoading
                                                ? "Carregando cargo..."
                                                : currentRoleLabel
                                                    ? `Cargo: ${currentRoleLabel}`
                                                    : "Cargo: Não definido"}
                                    </span>
                                </div>
                            </div>

                            <DropdownMenuSeparator />

                            <div className="p-1">
                                {!isAdminArea && (
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
                                )}
                                <DropdownMenuItem variant="destructive" onClick={onLogout} className="cursor-pointer">
                                    <LogOut className="h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AppSidebar() {
    const { user, isLoading } = useSession()
    const navigate = useNavigate()
    const location = useLocation()
    const { sessionUnit, isLoading: isSessionUnitLoading } = useSessionUnit()
    const { menuRoles, isMenuRolesLoading } = useSidebarMenu()

    const isAdminArea = location.pathname.startsWith("/admin")
    const isProfessionalSpecialtyLinkRoute =
        location.pathname.startsWith("/profissionais/") &&
        (new URLSearchParams(location.search).get("isSpecialtyLink") === "true" ||
         location.pathname === "/profissionais/vinculo-especialidades")

    const isSidebarDataLoading = isLoading || isSessionUnitLoading
    if (isSidebarDataLoading) {
        return null
    }

    // ── Role-based menu computation ──────────────────────────────────────────
    const menuItemsForRoles = menuRoles.flatMap((role) => {
        if (role === "internal_alfamed") return ADMINISTRATIVE_MENU_ITEMS
        if (allowedRoleKeys.has(role as RoleMenuKey)) return menuItemsByRole[role as RoleMenuKey]
        return []
    })
    const menuItems = Array.from(
        new Map<string, SidebarMenuItemConfig>(
            menuItemsForRoles.map((item) => [item.url, item])
        ).values()
    )

    const activeRoleKey = menuRoles.find((role) => {
        if (role === "internal_alfamed") return MENU_ROLE_KEYS.administrative
        return allowedRoleKeys.has(role as RoleMenuKey) ? (role as RoleMenuKey) : undefined
    }) as RoleMenuKey | undefined
    const currentRoleLabel = activeRoleKey ? roleLabels[activeRoleKey] : null

    // ── Active item detection ────────────────────────────────────────────────
    const isMenuItemActive = (item: SidebarMenuItemConfig) => {
        if (isProfessionalSpecialtyLinkRoute) {
            return item.url === "/profissionais"
        }

        return location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)
    }

    const handleLogout = async () => {
        await auth.signOut()
        navigate("/login", { replace: true })
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isAdminArea
                                ? <AdminSidebarMenu pathname={location.pathname} />
                                : (
                                    <RegularSidebarMenu
                                        menuItems={menuItems}
                                        hasMenuItems={menuItems.length > 0}
                                        isMenuRolesLoading={isMenuRolesLoading}
                                        isMenuItemActive={isMenuItemActive}
                                    />
                                )
                            }
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarUserFooter
                user={user}
                isLoading={isLoading}
                isAdminArea={isAdminArea}
                unitName={sessionUnit?.selectedUnitName}
                isSessionUnitLoading={isSessionUnitLoading}
                isMenuRolesLoading={isMenuRolesLoading}
                currentRoleLabel={currentRoleLabel}
                onLogout={handleLogout}
            />
        </Sidebar>
    )
}
