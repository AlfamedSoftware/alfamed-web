import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    CalendarCheck,
    ClipboardList,
    Home as HomeIcon,
    LogOut,
    Settings,
    Stethoscope,
    Users,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router"

const menuItems = [
    {
        title: "Dashboard",
        icon: HomeIcon,
        url: "/",
        isActive: true,
    },
    {
        title: "Pacientes",
        icon: Users,
        url: "/pacientes",
    },
    {
        title: "Profissionais",
        icon: Stethoscope,
        url: "/profissionais",
    },
    {
        title: "Agendamentos",
        icon: CalendarCheck,
        url: "/agendamentos",
    },
    {
        title: "Prontuários",
        icon: ClipboardList,
        url: "/prontuarios",
    },
    {
        title: "Configurações",
        icon: Settings,
        url: "/configuracoes",
    },
]

export function Home() {
    const { user, isLoading } = useSession()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await auth.signOut()
        navigate("/login", { replace: true })
    }

    const getUserInitial = () => {
        if (!user?.name) return "U"
        return user.name.charAt(0).toUpperCase()
    }

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-4">
                        <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Alfamed</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton isActive={item.isActive} tooltip={item.title}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="p-0">
                    <div className="border-t border-white/10 p-2 flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shrink-0">
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 ml-auto hover:bg-transparent hover:text-sidebar-foreground/50 cursor-pointer group-data-[collapsible=icon]:hidden"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-lg font-semibold">Dashboard</h1>
                </header>
                <div className="flex flex-1 flex-col p-4">
                    {/* Conteúdo da página aqui */}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}