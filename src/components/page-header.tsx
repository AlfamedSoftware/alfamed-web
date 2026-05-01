import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

interface PageHeaderProps {
    title: string
}

export function PageHeader({ title }: PageHeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-4 shadow-sm backdrop-blur">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="flex-1 text-lg font-semibold text-foreground">{title}</h1>
            <ThemeToggle />
        </header>
    )
}
