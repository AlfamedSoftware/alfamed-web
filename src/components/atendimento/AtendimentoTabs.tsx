import { lazy, Suspense, useState, type ComponentType } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type TabComponentProps = {
    scheduleId: string
    patientId: string
}

type AttendanceTab = {
    id: string
    label: string
    Component: ComponentType<TabComponentProps>
}

const tabs: AttendanceTab[] = [
    { id: "notas", label: "Notas Clinicas", Component: lazy(() => import("./tabs/NotasClinicas").then((module) => ({ default: module.NotasClinicas }))) },
    { id: "anamnese", label: "Anamnese", Component: lazy(() => import("./tabs/Anamnese").then((module) => ({ default: module.Anamnese }))) },
    { id: "lab", label: "Lab", Component: lazy(() => import("./tabs/ExamesLaboratoriais").then((module) => ({ default: module.ExamesLaboratoriais }))) },
    { id: "imagem", label: "Imagem", Component: lazy(() => import("./tabs/ExamesImagem").then((module) => ({ default: module.ExamesImagem }))) },
    { id: "receitas", label: "Receitas", Component: lazy(() => import("./tabs/Receitas").then((module) => ({ default: module.Receitas }))) },
    { id: "atestados", label: "Atestados", Component: lazy(() => import("./tabs/Atestados").then((module) => ({ default: module.Atestados }))) },
    { id: "diagnosticos", label: "Diagnosticos", Component: lazy(() => import("./tabs/Diagnosticos").then((module) => ({ default: module.Diagnosticos }))) },
    { id: "solicitacao", label: "Solicitacao de Exames", Component: lazy(() => import("./tabs/SolicitacaoExames").then((module) => ({ default: module.SolicitacaoExames }))) },
]

type AtendimentoTabsProps = {
    scheduleId: string
    patientId: string
}

export function AtendimentoTabs({ scheduleId, patientId }: AtendimentoTabsProps) {
    const [activeTabId, setActiveTabId] = useState(tabs[0].id)
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
    const ActiveComponent = activeTab.Component

    return (
        <div className="space-y-4">
            <div role="tablist" aria-label="Secoes do prontuario" className="flex flex-wrap gap-2 border-b border-border pb-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        id={`attendance-tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={activeTabId === tab.id}
                        aria-controls={`attendance-panel-${tab.id}`}
                        onClick={() => setActiveTabId(tab.id)}
                        className={cn(
                            "h-9 rounded-md px-3 text-sm font-medium transition",
                            activeTabId === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div
                id={`attendance-panel-${activeTab.id}`}
                role="tabpanel"
                aria-labelledby={`attendance-tab-${activeTab.id}`}
                className="min-h-80 rounded-lg border border-border bg-card p-4"
            >
                <Suspense fallback={<Skeleton className="h-40 rounded-lg" />}>
                    <ActiveComponent scheduleId={scheduleId} patientId={patientId} />
                </Suspense>
            </div>
        </div>
    )
}
