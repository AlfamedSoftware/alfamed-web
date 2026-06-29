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
    FlaskConical,
    Home as HomeIcon,
    Lock,
    LogOut,
    Stethoscope,
    User,
    Building2,
    HeartPulse,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { useUnitParameters } from "@/hooks/use-unit-parameters"
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

const roleLabels: Record<RoleMenuKey, string> = {
    [MENU_ROLE_KEYS.administrative]: "Administrativo",
    [MENU_ROLE_KEYS.assistant]: "Assistente administrativo",
    [MENU_ROLE_KEYS.medic]: "Médico",
    [MENU_ROLE_KEYS.technical_executor]: "Técnico Executante",
}

// ─── Shared helper ───────────────────────────────────────────────────────────

function MenuItemList({
    items,
    isMenuItemActive,
}: {
    items: SidebarMenuItemConfig[]
    isMenuItemActive: (item: SidebarMenuItemConfig) => boolean
}) {
    return (
        <>
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isMenuItemActive(item)} tooltip={item.title}>
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

// ─── Role menu components ────────────────────────────────────────────────────

type MenuProps = { isMenuItemActive: (item: SidebarMenuItemConfig) => boolean }
type MenuPropsWithUnit = MenuProps & { unitId: string | null }

function AdminSidebarMenu({ isMenuItemActive }: MenuProps) {
    return (
        <MenuItemList
            items={[
                { title: "Central de Unidades", icon: Lock, url: "/admin/unidades" },
                { title: "UPM",                 icon: User, url: "/admin/upm" },
            ]}
            isMenuItemActive={isMenuItemActive}
        />
    )
}

function AdministrativeSidebarMenu({ isMenuItemActive }: MenuProps) {
    return (
        <MenuItemList
            items={[
                { title: "Início",          icon: HomeIcon,      url: "/home" },
                { title: "Unidade",         icon: Building2,     url: "/unidade" },
                { title: "Profissionais",   icon: User,          url: "/profissionais" },
                { title: "Especialidades",  icon: Stethoscope,   url: "/especialidades" },
                { title: "Procedimentos",   icon: ClipboardList, url: "/procedimentos" },
                { title: "Agendas",         icon: CalendarDays,  url: "/agendas" },
            ]}
            isMenuItemActive={isMenuItemActive}
        />
    )
}

function MedicSidebarMenu({ isMenuItemActive }: MenuProps) {
    return (
        <MenuItemList
            items={[
                { title: "Início",        icon: HomeIcon,      url: "/home" },
                { title: "Agendas",       icon: CalendarDays,  url: "/agendas" },
                { title: "Atendimentos",  icon: HeartPulse,    url: "/atendimentos" },
                { title: "Prontuário",    icon: ClipboardList, url: "/prontuario" },
            ]}
            isMenuItemActive={isMenuItemActive}
        />
    )
}

function AssistantSidebarMenu({ unitId, isMenuItemActive }: MenuPropsWithUnit) {
    const { modulo1GestaoExames, isLoading } = useUnitParameters(unitId)

    if (isLoading) {
        return (
            <>
                <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
            </>
        )
    }

    return (
        <>
            <MenuItemList
                items={[
                    { title: "Início",   icon: HomeIcon,     url: "/home" },
                    { title: "Agendas",  icon: CalendarDays, url: "/agendas" },
                ]}
                isMenuItemActive={isMenuItemActive}
            />

            {modulo1GestaoExames ? (
                <MenuItemList
                    items={[
                        { title: "Liberação de exames", icon: FlaskConical, url: "/gestao-exames/listar-pendentes" },
                    ]}
                    isMenuItemActive={isMenuItemActive}
                />
            ) : null}
        </>
    )
}

function TechnicalExecutorSidebarMenu({ unitId, isMenuItemActive }: MenuPropsWithUnit) {
    const { modulo1GestaoExames, isLoading } = useUnitParameters(unitId)

    if (isLoading) {
        return (
            <>
                <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
            </>
        )
    }

    if (!modulo1GestaoExames) {
        return (
            <SidebarMenuItem>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                    O módulo de Gestão de Exames está desativado. Para contratar, entre em contato com a Alfamed.
                </div>
            </SidebarMenuItem>
        )
    }

    return (
        <MenuItemList
            items={[
                { title: "Início",          icon: HomeIcon,     url: "/home" },
                { title: "Execução de exames", icon: FlaskConical,  url: "/gestao-exames/listar" },
                { title: "Análise de exames",  icon: ClipboardList, url: "/gestao-exames/listar-analise" },
            ]}
            isMenuItemActive={isMenuItemActive}
        />
    )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function SidebarUserFooter({
    user,
    isLoading,
    isAdminArea,
    unitName,
    currentRoleLabel,
    onLogout,
}: {
    user: { name?: string | null } | null
    isLoading: boolean
    isAdminArea: boolean
    unitName: string | null | undefined
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
                                        {isAdminArea ? "ServiceDesk" : unitName || "Unidade selecionada"}
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
                                        {isAdminArea ? "Alfamed" : unitName ? `Unidade: ${unitName}` : "Unidade: Não selecionada"}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {isAdminArea ? "ServiceDesk" : currentRoleLabel ? `Cargo: ${currentRoleLabel}` : "Cargo: Não definido"}
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
    const unitId = sessionUnit?.selectedUnitId ?? null
    const { menuRoles, isMenuRolesLoading } = useSidebarMenu()

    const isAdminArea = location.pathname.startsWith("/admin")
    const isProfessionalSpecialtyLinkRoute =
        location.pathname.startsWith("/profissionais/") &&
        (new URLSearchParams(location.search).get("isSpecialtyLink") === "true" ||
         location.pathname === "/profissionais/vinculo-especialidades")

    const isSidebarDataLoading = isLoading || isSessionUnitLoading || isMenuRolesLoading
    if (isSidebarDataLoading) {
        return (
            <Sidebar collapsible="icon">
                <SidebarHeader />
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <SidebarMenuItem key={i}>
                                        <SidebarMenuSkeleton showIcon />
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <div className="flex items-center gap-2 px-2 py-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse" />
                        <div className="flex flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
                            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="h-4 w-4 shrink-0 rounded bg-muted animate-pulse group-data-[collapsible=icon]:hidden" />
                    </div>
                </SidebarFooter>
            </Sidebar>
        )
    }

    const currentRoleLabel =
        menuRoles.includes("internal_alfamed") || menuRoles.includes(MENU_ROLE_KEYS.administrative) ? roleLabels[MENU_ROLE_KEYS.administrative] :
        menuRoles.includes(MENU_ROLE_KEYS.medic)               ? roleLabels[MENU_ROLE_KEYS.medic] :
        menuRoles.includes(MENU_ROLE_KEYS.assistant)           ? roleLabels[MENU_ROLE_KEYS.assistant] :
        menuRoles.includes(MENU_ROLE_KEYS.technical_executor)  ? roleLabels[MENU_ROLE_KEYS.technical_executor] :
        null

    const isMenuItemActive = (item: SidebarMenuItemConfig) => {
        if (isProfessionalSpecialtyLinkRoute) return item.url === "/profissionais"
        return location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)
    }

    function renderMenu() {
        if (isAdminArea) return <AdminSidebarMenu isMenuItemActive={isMenuItemActive} />

        if (menuRoles.includes("internal_alfamed") || menuRoles.includes(MENU_ROLE_KEYS.administrative))
            return <AdministrativeSidebarMenu isMenuItemActive={isMenuItemActive} />
        if (menuRoles.includes(MENU_ROLE_KEYS.medic))
            return <MedicSidebarMenu isMenuItemActive={isMenuItemActive} />
        if (menuRoles.includes(MENU_ROLE_KEYS.assistant))
            return <AssistantSidebarMenu unitId={unitId} isMenuItemActive={isMenuItemActive} />
        if (menuRoles.includes(MENU_ROLE_KEYS.technical_executor))
            return <TechnicalExecutorSidebarMenu unitId={unitId} isMenuItemActive={isMenuItemActive} />

        return (
            <SidebarMenuItem>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhum cargo definido.<br />Entre em contato com a Alfamed.
                </div>
            </SidebarMenuItem>
        )
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
                            {renderMenu()}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarUserFooter
                user={user}
                isLoading={isLoading}
                isAdminArea={isAdminArea}
                unitName={sessionUnit?.selectedUnitName}
                currentRoleLabel={currentRoleLabel}
                onLogout={handleLogout}
            />
        </Sidebar>
    )
}
